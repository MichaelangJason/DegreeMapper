'use client'

import { AppStore, makeStore } from "@/store"
import { Provider } from "react-redux"
import { KeyPressListener, ToolTips } from "@/components/Common";
import { SideBar } from "@/components/Layout";
import { Terms } from "@/components/Term";
import { setDroppableId, setInitCourses, setIsInitialized, setDraggingType } from "@/store/slices/globalSlice";
import { deleteTerm, moveCourse, moveTerm, setTermsData } from "@/store/slices/termSlice";
import { DraggingType, LocalStorage } from "@/utils/enums";
import { DragDropContext, DragStart, DragUpdate, DropResult } from "@hello-pangea/dnd";
import { useDispatch } from "react-redux";
import { Flip, toast, ToastContainer } from "react-toastify";
import { TutorialModal, AboutModal } from "@/components/Modal";
import { useEffect, useRef } from "react";
import { IRawCourse } from "@/db/schema";
import { isValidPlanState, isValidTermData } from "@/utils/typeGuards";
import { setPlans } from "@/store/slices/planSlice";
import { Course } from "@/types/course";
import { setCoursesData } from "@/store/slices/courseSlice";


const App = () => {
  const dispatch = useDispatch();

  const handleDragStart = (start: DragStart) => {
    dispatch(setDraggingType(start.type as DraggingType));
    dispatch(setDroppableId(start.source.droppableId));
  }

  const handleDragUpdate = (update: DragUpdate) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { destination, source, draggableId, type } = update;
    if (!destination) {
      dispatch(setDraggingType(null));
      dispatch(setDroppableId(null));
    }
    else {
      dispatch(setDraggingType(type as DraggingType));
      dispatch(setDroppableId(destination.droppableId));
    }
  }

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId, type } = result;
    dispatch(setDraggingType(null));
    dispatch(setDroppableId(null));
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) return;
    if (destination.droppableId === "delete-term") {
      // delete the dom with the draggableId in data-rfd-draggable-id
      dispatch(deleteTerm(draggableId));
      return;
    }
    if (type === DraggingType.TERM) {
      dispatch(moveTerm({ sourceIdx: source.index, destinationIdx: destination.index }));
    }
    if (type === DraggingType.COURSE) {
      dispatch(moveCourse({
        courseId: draggableId,
        sourceIdx: source.index, 
        destinationIdx: destination.index, 
        sourceTermId: source.droppableId, 
        destinationTermId: destination.droppableId 
      }));
    }
  }
  
  return (
    <>
      <DragDropContext 
        onDragStart={handleDragStart} 
        onDragEnd={handleDragEnd}
        onDragUpdate={handleDragUpdate}
      >
        <SideBar />
        <Terms />
        <KeyPressListener />
        <ToastContainer
          position="bottom-right"
          autoClose={5000}
          hideProgressBar={true}
          newestOnTop={false}
          closeOnClick={false}
          pauseOnHover={false}
          rtl={false}
          draggable
          theme="light"
          transition={Flip}
          stacked
        />
      </DragDropContext>
      <KeyPressListener />
      <ToolTips />
      <TutorialModal />
      <AboutModal />
    </>
  );
}

const Wrapper = (props: { initCourses: IRawCourse[] }) => {
  const storeRef = useRef<AppStore>(null);

  // only run once
  if (!storeRef.current) {
    storeRef.current = makeStore()
  }

  const isInitialized = storeRef.current.getState().global.isInitialized;
  const dispatch = storeRef.current.dispatch;

  useEffect(() => {
    const initializeData = async () => {
      if (isInitialized) return;

      dispatch(setInitCourses(props.initCourses));
      
      const savedPlans = localStorage.getItem(LocalStorage.PLANS);
      const savedTerms = localStorage.getItem(LocalStorage.TERMS);

      // XORS to check if both are present
      if (!!savedPlans !== !!savedTerms) {
        // clear local storage?
        // localStorage.removeItem(LocalStorage.PLANS);
        // localStorage.removeItem(LocalStorage.TERMS);
        toast.error("Failed Loading Previous Session")
      }

      if (savedPlans && savedTerms) {
        const plans = JSON.parse(savedPlans);
        const terms = JSON.parse(savedTerms);

        await toast.promise(
          async () => {
            if (!isValidPlanState(plans) || !isValidTermData(terms)) {
              throw new Error("Invalid plan or term state");
            }
            const courseIds = new Set(Object.values(terms).flatMap(term => term.courseIds));
            const courses = await fetch('/api/courses', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ courseIds: Array.from(courseIds) })
            })

            if (!courses.ok) {
              throw new Error("Failed to fetch courses");
            }

            const coursesData = await courses.json() as Course[];

            if (coursesData?.length !== courseIds.size) {
              throw new Error("Failed to fetch courses");

            }

            dispatch(setCoursesData(coursesData));
            dispatch(setTermsData(terms));
            dispatch(setPlans(plans));
          },
          {
            pending: 'Loading last state...',
            error: 'Failed to load last state',
            success: 'Last state restored!',
          }
        )
        
      }

      toast.success("Initialized!")
      document.body.style.overflow = 'scroll'
      dispatch(setIsInitialized(true));
    };
    initializeData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Provider store={storeRef.current}>
      <App/>
    </Provider>
  )
}

export default Wrapper;