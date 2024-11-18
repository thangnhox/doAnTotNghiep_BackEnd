import { fromPath } from 'pdf2pic';
import { WriteImageResponse } from 'pdf2pic/dist/types/convertResponse';

interface imageSize {
    width?: number;
    height?: number;
    density?: number
};

export async function convertPdfPageToImage(pdfPath: string, pageNumber: number, output: string, { width = 600, height = 600, density = 100 }: imageSize = {}): Promise<WriteImageResponse | null> {
    const options = {
        density: density,
        saveFilename: output,
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
