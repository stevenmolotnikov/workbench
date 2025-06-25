import { Tensor } from '@huggingface/transformers';

export interface Token {
    id: number;
    text: string;
    idx?: number;
    probability?: number;
}

type BatchEncoding = {
    input_ids: number[] | number[][] | Tensor;
    attention_mask: number[] | number[][] | Tensor;
    token_type_ids?: number[] | number[][] | Tensor;
}

export type TokenizerOutput =
    | string
    | Tensor
    | number[]
    | number[][]
    | BatchEncoding;