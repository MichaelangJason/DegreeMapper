import { CourseCode } from "@/types/course";
import { TermMap } from "@/types/term";
import { TermId } from "@/types/term";

export const isSatisfied = (
  {prerequisites, antirequisites, corequisites, terms, termId}: {
    prerequisites?: CourseCode[][],
    antirequisites?: CourseCode[],
    corequisites?: CourseCode[],
    terms: {
      data: TermMap;
      order: TermId[];
      inTermCourseIds: CourseCode[];
    },
    termId: string
  }
) => {
  const { order } = terms;
  const thisTermIdx = order.indexOf(termId);
  const thisTermCourseIds = terms.data[termId].courseIds;
  const prevTermCourseIds = order
    .slice(0, thisTermIdx)
    .flatMap(termId => terms.data[termId].courseIds);

  const prereqSatisfied = !prerequisites || prerequisites.every(group => 
    // every group must have at least one course from the previous term
    group.some(id => prevTermCourseIds.includes(id))
  );

  const antireqSatisfied = !antirequisites || antirequisites.every(
    // every antirequisite must be from the previous term or this term
    id => !prevTermCourseIds.includes(id) && !thisTermCourseIds.includes(id)
  );

  const coreqSatisfied = !corequisites || corequisites.every(
    // every corequisite must be from the previous term or this term
    id => prevTermCourseIds.includes(id) || thisTermCourseIds.includes(id)
  );

  return prereqSatisfied && antireqSatisfied && coreqSatisfied;
}

// export const splitCourseCodes = (courseCodes: string[]) => {
//   const regex = /([A-Z]{4}\s\d{4})|(.*)/g;

// }
