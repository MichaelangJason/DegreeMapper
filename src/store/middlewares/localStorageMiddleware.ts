import { createListenerMiddleware } from "@reduxjs/toolkit";
import { AppDispatch, RootState } from "..";
import { toast } from "react-toastify";
import { LocalStorage } from "@/utils/enums";
import { isTermActions, isCourseTakenAction, isPlanActions, isAssistantAction } from "@/utils/typeGuards";

const listenerMiddleware = createListenerMiddleware();
const startListening = listenerMiddleware.startListening.withTypes<
  RootState,
  AppDispatch
>();

// save the term and plan data to local storage
startListening({
  predicate: (action) => {
    // there are not many overhead here, so lets keep this simple
    return isTermActions(action) || isCourseTakenAction(action) || isPlanActions(action);
  },
  effect: (_, listenerApi) => {
    // only store term data here
    const termData = listenerApi.getState().terms.data;
    const planData = listenerApi.getState().plans;

    try {
      localStorage.setItem(LocalStorage.TERMS, JSON.stringify(termData));
      localStorage.setItem(LocalStorage.PLANS, JSON.stringify(planData));
    } catch (error) {
      console.error(error);
      toast.error("Term and Plan Saving Failed")
    }
  }
})

// save the assistant thread ids to local storage
startListening({
  predicate: (action) => {
    return isAssistantAction(action);
  },
  effect: (_, listenerApi) => {
    const assistantData = listenerApi.getState().assistant;

    try {
      localStorage.setItem(LocalStorage.ASSISTANT, JSON.stringify(assistantData));
    } catch (error) {
      console.error(error);
      toast.error("Assistant Saving Failed")
    }
  }
})

export default listenerMiddleware.middleware;