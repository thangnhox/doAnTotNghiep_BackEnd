import { ValueTransformer } from "typeorm";

export const decimalTransformer: ValueTransformer = {
    to: (value: number) => value,
    from: (value: string) => parseFloat(value)
}

export const bufferTransformer: ValueTransformer = {
	to: (value: number) => Buffer.from([value]),
	from: (value: Buffer) => value.readUInt8(0)
};

