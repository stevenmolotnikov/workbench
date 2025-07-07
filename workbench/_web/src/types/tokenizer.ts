export interface Token {
    id: number;
    text: string;
    idx?: number;
    probability?: number;
}

type BatchEncoding = {
    input_ids: number[] | number[][];
    attention_mask: number[] | number[][];
    token_type_ids?: number[] | number[][];
}

export type TokenizerOutput =
    | string
    | number[]
    | number[][]
    | BatchEncoding;