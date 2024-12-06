import { ValueTransformer } from "typeorm";

export const decimalTransformer: ValueTransformer = {
    to: (value: number) => value,
    from: (value: string) => parseFloat(value)
}

export const bufferTransformer: ValueTransformer = {
    to: (value: number | null | undefined) => {
        if (value === null || value === undefined) {
            return Buffer.from([0]); // Default value to handle null/undefined
        }
        return Buffer.from([value]);
    },
    from: (value: Buffer | null | undefined) => {
        if (value === null || value === undefined || value.length === 0) {
            return 0; // Default value to handle null/undefined/empty buffer
        }
        try {
            return value.readUInt8(0);
        } catch (err) {
            console.error('Error reading buffer:', err);
            return 0; // Default value if buffer read fails
        }
    }
};

