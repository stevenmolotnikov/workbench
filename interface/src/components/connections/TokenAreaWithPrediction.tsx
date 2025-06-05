// import { ConnectableTokenArea } from "./ConnectableTokenArea";
import { Prediction } from "@/types/workspace";
import { Token } from "@/types/tokenizer";
import { PatchingCompletion } from "@/types/patching";

interface TokenAreaWithPredictionProps {
    counterId: number;
    title: string;
    text: string;
    prediction: Prediction;
    tokenData: Token[] | null;
    completion: PatchingCompletion;
    setter: (comp: PatchingCompletion) => void;
    isConnecting: boolean;
    connectionMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
    connectionMouseUp: (e: React.MouseEvent<HTMLDivElement>) => void;
    onTokenUnhighlight: (tokenIndex: number, counterIndex: number) => void;
    isTokenizing: boolean;
    tokenError: string | null;
    onTokenSelection: (indices: number[]) => void;
}

export function TokenAreaWithPrediction({
    counterId,
    title,
    text,
    prediction,
    tokenData,
    completion,
    setter,
    isConnecting,
    connectionMouseDown,
    connectionMouseUp,
    onTokenUnhighlight,
    isTokenizing,
    tokenError,
    onTokenSelection
}: TokenAreaWithPredictionProps) {
    return (
        <div className="flex flex-col h-full bg-card p-4 rounded-md border">
            <div className="flex flex-row justify-between items-center pb-2">
                <span className="text-xs">{title}</span>
                <span className="text-xs">
                    Prediction: {prediction.str_indices.length > 0 ? prediction.str_indices[0] : "N/A"}
                    ({prediction.indices.length > 0 ? prediction.indices[0] : ""})
                </span>
            </div>

            {/* <ConnectableTokenArea
                text={text}
                tokenData={tokenData}
                isConnecting={isConnecting}
                connectionMouseDown={connectionMouseDown}
                connectionMouseUp={connectionMouseUp}
                counterId={counterId}
                onTokenUnhighlight={onTokenUnhighlight}
                isTokenizing={isTokenizing}
                tokenError={tokenError}
                onTokenSelection={onTokenSelection}
                filledTokens={completion.tokens}
            /> */}
        </div>
    );
} 