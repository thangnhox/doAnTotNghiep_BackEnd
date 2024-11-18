import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';
import { Mutex } from 'async-mutex';

class PDFCache {
    private static instance: PDFCache;
    private cache: Map<number, string> = new Map();
    private static maxCacheSize: number;
    private static cacheDir: string;
    private currentCacheSize: number = 0;
    private cacheMutex: Mutex;

    private constructor() {
        this.cacheMutex = new Mutex();
        if (!fs.existsSync(PDFCache.cacheDir)) {
            fs.mkdirSync(PDFCache.cacheDir, { recursive: true });
        } else {
            this.initializeCache();
        }
    }

    public static getCacheDir(): string | undefined {
        if (PDFCache.cacheDir === undefined)
            return undefined;
        return PDFCache.cacheDir;
    }

    public static setup(maxCacheSize: number, cacheDir: string): void {
        PDFCache.maxCacheSize = maxCacheSize;
        PDFCache.cacheDir = cacheDir;
    }

    public static getInstance(): PDFCache {
        if (!PDFCache.instance) {
            if (PDFCache.maxCacheSize === undefined || PDFCache.cacheDir === undefined) {
                throw new Error("PDFCache not properly configured. Call setup before getInstance.");
            }
            PDFCache.instance = new PDFCache();
        }
        return PDFCache.instance;
    }

    private initializeCache(): void {
        const files = fs.readdirSync(PDFCache.cacheDir);
        for (const file of files) {
            const filePath = path.join(PDFCache.cacheDir, file);
            const fileSize = fs.statSync(filePath).size;
            const id = parseInt(path.basename(file, '.pdf'));
            this.cache.set(id, filePath);
            this.currentCacheSize += fileSize;
        }
    }

    async loadAndCachePDF(url: string, id: number): Promise<string> {
        return this.cacheMutex.runExclusive(async () => {
            if (this.cache.has(id)) {
                console.log('Fetching from cache');
                return this.cache.get(id) as string;
            }

            console.log('Fetching from URL');
            const filePath = path.join(PDFCache.cacheDir, `${id}.pdf`);

            await this.downloadPDF(url, filePath);

            const fileSize = fs.statSync(filePath).size;
            this.addToCache(id, filePath, fileSize);

            return filePath;
        });
    }

    private addToCache(id: number, filePath: string, fileSize: number): void {
        if (this.currentCacheSize + fileSize > PDFCache.maxCacheSize) {
            this.clearCache();
        }

        this.cache.set(id, filePath);

        if (!fs.existsSync(`${PDFCache.cacheDir}/${id}.d/`)) {
            fs.mkdirSync(`${PDFCache.cacheDir}/${id}.d/`, { recursive: true });
        }

        this.currentCacheSize += fileSize;
    }

    // TODO: Remove both pdf file and image cache.
    private clearCache(): void {
        console.log('Clearing cache');
        this.cache.forEach((filePath, id) => {
            fs.unlinkSync(filePath);
        });
        this.cache.clear();
        this.currentCacheSize = 0;
    }

    private downloadPDF(url: string, dest: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const file = fs.createWriteStream(dest);
            https.get(url, (response) => {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    resolve();
                });
            }).on('error', (err) => {
                fs.unlink(dest, () => reject(err));
            });
        });
    }
}

export default PDFCache;
