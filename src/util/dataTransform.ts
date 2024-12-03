import { ValueTransformer } from "typeorm";

export const decimalTranformer: ValueTransformer = {
    to: (value: number) => value,
    from: (value: string) => parseFloat(value)
}