import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  onSnapshot, 
  type Unsubscribe 
} from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../firebase.ts';
import { sanitizeFirestoreData } from '../utils/firestoreSanitizer.ts';

export interface AdminSticker {
  id: string;
  name: string;
  category: string;
  imageUrl: string; // PNG base64 Data URL or public PNG URL
  price: number; // 0 for Free, or amount in Karma / Coins
  width?: number;
  height?: number;
  fileSizeKb?: number;
  uploadedBy?: string;
  createdAt: string;
  isActive: boolean;
}

const LOCAL_STORAGE_STICKERS_KEY = 'learning_os_admin_png_stickers_v2';
const LOCAL_STORAGE_UNLOCKED_KEY = 'learning_os_unlocked_stickers_v1';
const BROADCAST_CHANNEL_NAME = 'learning_os_stickers_sync_channel';

class StickerService {
  private stickers: AdminSticker[] = [];
  private broadcast: BroadcastChannel | null = null;
  private listeners: Set<(stickers: AdminSticker[]) => void> = new Set();
  private isHydrated: boolean = false;
  private unlockedStickerIds: Set<string> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.broadcast = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        this.broadcast.onmessage = (event) => {
          if (event.data?.type === 'STICKERS_UPDATED') {
            this.hydrateFromLocalStorage();
            this.notifyListeners();
          }
        };
      } catch (e) {
        console.warn('[StickerService] BroadcastChannel not supported:', e);
      }

      // Clean up legacy test stickers if any existed in older storage keys
      try {
        localStorage.removeItem('learning_os_test_stickers');
        localStorage.removeItem('learning_os_mock_stickers');
      } catch {}

      this.hydrateFromLocalStorage();
      this.hydrateUnlockedStickers();
    }
  }

  private hydrateFromLocalStorage() {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_STICKERS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          this.stickers = parsed.map((stk) => ({
            ...stk,
            price: typeof stk.price === 'number' ? Math.max(0, stk.price) : 0,
          }));
          this.isHydrated = true;
          return;
        }
      }
    } catch (e) {
      console.warn('[StickerService] Failed to parse local stickers:', e);
    }
    // Default: empty array, NO test stickers
    this.stickers = [];
    this.isHydrated = true;
  }

  private hydrateUnlockedStickers() {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_UNLOCKED_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          this.unlockedStickerIds = new Set(parsed);
        }
      }
    } catch {}
  }

  private saveUnlockedStickers() {
    try {
      localStorage.setItem(LOCAL_STORAGE_UNLOCKED_KEY, JSON.stringify(Array.from(this.unlockedStickerIds)));
    } catch {}
  }

  private saveToLocalStorage() {
    try {
      localStorage.setItem(LOCAL_STORAGE_STICKERS_KEY, JSON.stringify(this.stickers));
      if (this.broadcast) {
        this.broadcast.postMessage({ type: 'STICKERS_UPDATED' });
      }
    } catch (e) {
      console.warn('[StickerService] Failed to write stickers to local storage:', e);
    }
  }

  private notifyListeners() {
    const list = this.getAllStickers();
    this.listeners.forEach((listener) => {
      try {
        listener(list);
      } catch (err) {
        console.error('[StickerService] Listener notification error:', err);
      }
    });
  }

  public getAllStickers(): AdminSticker[] {
    if (!this.isHydrated) {
      this.hydrateFromLocalStorage();
    }
    return [...this.stickers];
  }

  public getActiveStickers(): AdminSticker[] {
    return this.getAllStickers().filter((s) => s.isActive !== false);
  }

  public getCategories(): string[] {
    const active = this.getActiveStickers();
    const set = new Set<string>();
    active.forEach((s) => {
      if (s.category && s.category.trim()) {
        set.add(s.category.trim());
      }
    });
    return Array.from(set);
  }

  public subscribeStickers(callback: (stickers: AdminSticker[]) => void): Unsubscribe {
    this.listeners.add(callback);
    callback(this.getAllStickers());

    let firestoreUnsub: Unsubscribe | null = null;

    if (isFirebaseConfigured && db) {
      try {
        const stickersCol = collection(db, 'admin_stickers');
        firestoreUnsub = onSnapshot(
          stickersCol,
          (snapshot) => {
            const cloudStickers: AdminSticker[] = snapshot.docs.map((docSnap) => {
              const data = docSnap.data();
              return {
                ...data,
                id: docSnap.id,
                price: typeof data.price === 'number' ? Math.max(0, data.price) : 0,
              } as AdminSticker;
            });

            if (cloudStickers.length > 0 || snapshot.empty) {
              this.stickers = cloudStickers;
              this.saveToLocalStorage();
              this.notifyListeners();
            }
          },
          (err) => {
            console.warn('[StickerService] Firestore sticker subscription warning:', err);
          }
        );
      } catch (e) {
        console.warn('[StickerService] Firestore snapshot init error:', e);
      }
    }

    return () => {
      this.listeners.delete(callback);
      if (firestoreUnsub) {
        firestoreUnsub();
      }
    };
  }

  /**
   * Check if a sticker is unlocked for the current user
   */
  public isStickerUnlocked(sticker: AdminSticker): boolean {
    if (!sticker || sticker.price <= 0) return true;
    return this.unlockedStickerIds.has(sticker.id);
  }

  /**
   * Purchase / Unlock sticker for user with Karma
   */
  public unlockSticker(sticker: AdminSticker, currentKarma: number): { success: boolean; newKarma: number; error?: string } {
    if (this.isStickerUnlocked(sticker)) {
      return { success: true, newKarma: currentKarma };
    }

    if (currentKarma < sticker.price) {
      return {
        success: false,
        newKarma: currentKarma,
        error: `Недостаточно очков кармы (${currentKarma} XP). Требуется ${sticker.price} XP для разблокировки стикера «${sticker.name}».`,
      };
    }

    this.unlockedStickerIds.add(sticker.id);
    this.saveUnlockedStickers();
    const newKarma = currentKarma - sticker.price;

    return { success: true, newKarma };
  }

  /**
   * Helper to process uploaded PNG file: validates MIME, checks dimensions, converts to DataURL
   */
  public async processPngFile(file: File): Promise<{
    dataUrl: string;
    width: number;
    height: number;
    sizeKb: number;
  }> {
    if (!file.type.includes('png') && !file.name.toLowerCase().endsWith('.png')) {
      if (!file.type.startsWith('image/')) {
        throw new Error('Пожалуйста, выберите файл в формате PNG.');
      }
    }

    // File size limit: 3MB max for high quality PNG stickers
    if (file.size > 3 * 1024 * 1024) {
      throw new Error('Размер PNG файла не должен превышать 3 МБ.');
    }

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Ошибка чтения файла'));
      reader.readAsDataURL(file);
    });

    const dimensions = await new Promise<{ width: number; height: number }>((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          width: img.naturalWidth || 256,
          height: img.naturalHeight || 256,
        });
      };
      img.onerror = () => resolve({ width: 256, height: 256 });
      img.src = dataUrl;
    });

    return {
      dataUrl,
      width: dimensions.width,
      height: dimensions.height,
      sizeKb: Math.round(file.size / 1024),
    };
  }

  /**
   * Admin-only: Upload & register a new PNG sticker with price
   */
  public async addSticker(params: {
    name: string;
    category: string;
    imageUrl: string;
    price?: number;
    width?: number;
    height?: number;
    fileSizeKb?: number;
    uploadedBy?: string;
  }): Promise<AdminSticker> {
    const id = `sticker-png-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newSticker: AdminSticker = {
      id,
      name: params.name.trim() || 'PNG Стикер',
      category: params.category.trim() || 'Общие',
      imageUrl: params.imageUrl,
      price: typeof params.price === 'number' && !isNaN(params.price) ? Math.max(0, Math.floor(params.price)) : 0,
      width: params.width || 256,
      height: params.height || 256,
      fileSizeKb: params.fileSizeKb || 0,
      uploadedBy: params.uploadedBy || auth.currentUser?.displayName || 'Администратор',
      createdAt: new Date().toISOString(),
      isActive: true,
    };

    // 1. Local update
    this.stickers = [newSticker, ...this.stickers.filter((s) => s.id !== id)];
    this.saveToLocalStorage();
    this.notifyListeners();

    // 2. Cloud Firestore sync
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, 'admin_stickers', id);
        await setDoc(docRef, sanitizeFirestoreData(newSticker));
      } catch (err) {
        console.warn('[StickerService] Firestore add sticker sync warning:', err);
      }
    }

    return newSticker;
  }

  /**
   * Admin-only: Update sticker price
   */
  public async updateStickerPrice(id: string, newPrice: number): Promise<void> {
    const validPrice = Math.max(0, Math.floor(newPrice || 0));
    const target = this.stickers.find((s) => s.id === id);
    if (!target) return;

    target.price = validPrice;
    this.stickers = [...this.stickers];
    this.saveToLocalStorage();
    this.notifyListeners();

    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, 'admin_stickers', id);
        await setDoc(docRef, sanitizeFirestoreData(target), { merge: true });
      } catch (err) {
        console.warn('[StickerService] Firestore update sticker price warning:', err);
      }
    }
  }

  /**
   * Admin-only: Delete sticker
   */
  public async deleteSticker(id: string): Promise<void> {
    this.stickers = this.stickers.filter((s) => s.id !== id);
    this.saveToLocalStorage();
    this.notifyListeners();

    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, 'admin_stickers', id);
        await deleteDoc(docRef);
      } catch (err) {
        console.warn('[StickerService] Firestore delete sticker warning:', err);
      }
    }
  }

  /**
   * Admin-only: Toggle sticker active status
   */
  public async toggleStickerActive(id: string): Promise<void> {
    const target = this.stickers.find((s) => s.id === id);
    if (!target) return;

    target.isActive = !target.isActive;
    this.stickers = [...this.stickers];
    this.saveToLocalStorage();
    this.notifyListeners();

    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, 'admin_stickers', id);
        await setDoc(docRef, sanitizeFirestoreData(target), { merge: true });
      } catch (err) {
        console.warn('[StickerService] Firestore toggle sticker warning:', err);
      }
    }
  }

  /**
   * Clear all stickers (removes all test stickers)
   */
  public async clearAllStickers(): Promise<void> {
    const currentIds = this.stickers.map((s) => s.id);
    this.stickers = [];
    this.saveToLocalStorage();
    this.notifyListeners();

    if (isFirebaseConfigured && db) {
      try {
        for (const id of currentIds) {
          await deleteDoc(doc(db, 'admin_stickers', id));
        }
      } catch (err) {
        console.warn('[StickerService] Firestore clear all warning:', err);
      }
    }
  }
}

export const stickerService = new StickerService();
