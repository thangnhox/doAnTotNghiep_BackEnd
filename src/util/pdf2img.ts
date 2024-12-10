import { fromPath } from 'pdf2pic';
import { WriteImageResponse } from 'pdf2pic/dist/types/convertResponse';
import fs from 'fs';
import path from 'path';

interface ImageSize {
    width?: number;
    height?: number;
    density?: number
};

export async function convertPdfPageToImage(pdfPath: string, pageNumber: number, output: string, { width = 600, height = 600, density = 100 }: ImageSize = {}): Promise<WriteImageResponse | null> {
    const options = {
        density: density,
        saveFilename: `${width}.${height}.${density}.${pageNumber}`,
        savePath: output,
        format: 'png',
        width: width,
        height: height,
    };

    const convert = fromPath(pdfPath, options);
    const pageToConvertAsImage = pageNumber;

    try {
		const result = await convert(pageToConvertAsImage, {
			responseType: 'image',
		});
		return result;
	} catch (error) {
		console.error('Conversion error:', error);
	}
	
    return null;
}

class ConversionQueue {
    private queue: (() => Promise<void>)[] = [];
    private isProcessing = false;

    async add(task: () => Promise<void>): Promise<void> {
        this.queue.push(task);
        if (!this.isProcessing) {
            this.processQueue();
        }
    }

    private async processQueue(): Promise<void> {
        if (this.queue.length === 0) {
            this.isProcessing = false;
            return;
        }

        this.isProcessing = true;
        const task = this.queue.shift();
        if (task) {
            await task();
        }
        this.processQueue();
    }
}

const conversionQueue = new ConversionQueue();

export async function convertPdfPage2Image(
    pdfPath: string,
    pageNumber: number,
    output: string,
    { width = 600, height = 600, density = 100 }: ImageSize = {}
): Promise<WriteImageResponse | null> {
    const options = {
        density: density,
        saveFilename: `${width}.${height}.${density}.${pageNumber}`,
        savePath: output,
        format: 'png',
        width: width,
        height: height,
    };

    const fullPath = path.join(options.savePath, `${options.saveFilename}.${pageNumber}.${options.format}`);

    const convert = fromPath(pdfPath, options);
    const pageToConvertAsImage = pageNumber;

    return new Promise<WriteImageResponse | null>((resolve, reject) => {
        conversionQueue.add(async () => {
            try {
                console.log('Current working directory:', process.cwd());
                if (fs.existsSync(fullPath)) {
                    console.log(`${fullPath} found`);
                    const result = {
                        name: options.saveFilename,
                        size: fs.statSync(fullPath).size.toString(),
                        path: fullPath,
                    } as WriteImageResponse;

                    resolve(result);
                } else {
                    console.log(`${fullPath} not found`);

                    const result = await convert(pageToConvertAsImage, {
                        responseType: 'image',
                    });
                    resolve(result);
                }
            } catch (error) {
                console.error('Conversion error:', error);
                resolve(null);
            }
        });
    });
}