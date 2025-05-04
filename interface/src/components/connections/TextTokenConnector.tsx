import { useConnection } from '../../hooks/useConnection';
import { Edges } from './Edge';

export function TextTokenConnector() {
    const {
        connections,
        isDragging,
        currentConnection,
        selectedEdgeIndex,
        svgRef,
        handleBoxMouseDown,
        handleBoxMouseUp,
        handleEdgeSelect,
        handleBackgroundClick,
    } = useConnection();

    return (
        <div className="relative w-full h-[400px] border rounded-lg p-4" onClick={handleBackgroundClick}>
            <div className="absolute inset-0 select-none">
                <Edges 
                    connections={connections} 
                    isDragging={isDragging} 
                    currentConnection={currentConnection} 
                    svgRef={svgRef}
                    onEdgeSelect={handleEdgeSelect}
                    selectedEdgeIndex={selectedEdgeIndex}
                />
                
                <div className="absolute left-10 top-10">
                    <div
                        className="w-20 h-20 border rounded cursor-pointer flex items-center justify-center"
                        onMouseDown={handleBoxMouseDown}
                        onMouseUp={handleBoxMouseUp}
                    >
                        Box 1
                    </div>
                </div>
                
                <div className="absolute right-10 top-10">
                    <div
                        className="w-20 h-20 border rounded cursor-pointer flex items-center justify-center"
                        onMouseDown={handleBoxMouseDown}
                        onMouseUp={handleBoxMouseUp}
                    >
                        Box 2
                    </div>
                </div>
                
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
                    <div
                        className="w-20 h-20 border rounded cursor-pointer flex items-center justify-center"
                        onMouseDown={handleBoxMouseDown}
                        onMouseUp={handleBoxMouseUp}
                    >
                        Box 3
                    </div>
                </div>
            </div>
        </div>
    );
} 