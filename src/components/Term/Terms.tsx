import { useSelector } from "react-redux";
import TermCard from "./TermCard";
import Image from "next/image";
import { RootState } from "@/store";
import { TermId } from "@/types/term";
import { Droppable } from "@hello-pangea/dnd";
import { useDispatch } from "react-redux";
import { addTerm } from "@/store/slices/termSlice";
import "@/styles/terms.scss";
import { Constants, DraggingType } from "@/utils/enums";
import { useEffect } from "react";
import { setSeekingInfo } from "@/store/slices/globalSlice";
import { Seeking } from "@/components/Layout";
import { TermCardSkeleton } from "../Skeleton";
import { getTermCardConfig } from "@/utils/skeleton";

const Terms = () => {
  const order = useSelector((state: RootState) => state.terms.order);
  const isDragging = useSelector((state: RootState) => 
    state.global.draggingType === DraggingType.TERM
  );
  const { seekingId,seekingTerm } = useSelector((state: RootState) => state.global.seekingInfo);
  const isSeeking = seekingId !== undefined && seekingTerm !== undefined;
  const isSideBarExpanded = useSelector((state: RootState) => state.global.isSideBarExpanded);
  const isAssistantExpanded = useSelector((state: RootState) => state.global.isAssistantExpanded);
  const isInitialized = useSelector((state: RootState) => state.global.isInitialized)

  const dispatch = useDispatch();

  useEffect(() => {
    if (isDragging) {
      document.body.classList.add('dragging');
    } else {
      document.body.classList.remove('dragging');
    }
  }, [isDragging]);

  const handleAddTerm = () => {
    dispatch(addTerm());
  }

  const handleSeekingMaskClick = () => {
    dispatch(setSeekingInfo({ })); // clear seeking info
  }
  
  return (
    <>
      <Droppable droppableId="terms" direction="horizontal" type={DraggingType.TERM}>
        {(provided) => (
          <div 
            className="terms" 
            ref={provided.innerRef} 
            {...provided.droppableProps}
            id="terms"
          >
            {/* <Image 
              className="terms-background" 
              src="/school.webp" 
              alt="school" 
              width={2400} height={2400}
              style={{
                width: "100%",
                height: "auto"
              }}
            /> */}
            {isSeeking && <div className="seeking-mask" onClick={handleSeekingMaskClick}/>}
            <div className={`terms-placeholder-box ${isSideBarExpanded ? '' : 'folded'}`}/>
            {isInitialized 
              ? order.flatMap((termId: TermId, index: number) => {
                return [
                  <TermCard key={termId} termId={termId} index={index} />,
                  seekingTerm === termId && <Seeking key={"seeking-" + termId} />
                ]
              }) 
              : Array(Constants.MOCK_NUM_TERMS).fill(null).map((_, idx) => {
                  const mockConfig = getTermCardConfig();
                  return (<TermCardSkeleton key={'mock-term-card-'+idx} coursesConfig={mockConfig}/>)
              })}
            <div className={`terms-placeholder-box ${isAssistantExpanded ? '' : 'folded'}`}/>
            {provided.placeholder}
          </div>
        )}
      </Droppable>
      <Image 
        className={`add-term-button ${isAssistantExpanded ? 'expanded' : ''}`} 
        src="add.svg" 
        alt="add" 
        width={30} 
        height={30} 
        onClick={handleAddTerm}/>
    </>
  )
}

export default Terms;