import type { Utility } from "@/content/utilities";
import { projectLimits, workLimits, type ProjectDraft, type WorkDraft } from "./model";

const featured = "Rideshare 99";

function fit(value: string, label: string, max: number) {
  if (value.trim().length < 8 || value.trim().length > max) throw new Error(`${label} is ${value.trim().length} characters.`);
  return value;
}

export function firstWeek(utility: Utility): { project: ProjectDraft; work: WorkDraft[] } {
  const project: ProjectDraft = {
    title: "First week",
    outcome: utility.name === featured
      ? "A plain description, a first city, and lists of what riders and drivers need."
      : `A plain description of ${utility.name}, the first place it starts, and what an operator needs.`,
  };
  const work: WorkDraft[] = utility.name === featured
    ? [
        { kind: "task", title: "Write the one-page description", description: "Write what Rideshare 99 is, in plain language, for a rider and for a driver. Say what changes when the people who drive and build it keep the value.", doneWhen: "A one-page description is posted on this Mission." },
        { kind: "task", title: "Name the first city", description: "Pick one city to start. Say why people there would try an open ride service before a second city exists.", doneWhen: "The Mission names the first city and why." },
        { kind: "task", title: "List what a driver needs", description: "List what a person who drives needs on day one: safety, how they are paid, and how a ride reaches them. This is a list, not the software.", doneWhen: "The list is posted where other people can read it." },
        { kind: "task", title: "List what a rider needs", description: "List what a rider needs in order to trust a ride: who is driving, what it costs, and how to get help.", doneWhen: "The list is posted where other people can read it." },
        { kind: "task", title: "Sketch the first screen", description: "Draw or describe the first screen a rider would see. Paper or a simple picture is enough.", doneWhen: "The sketch is posted or described on this Mission." },
        { kind: "role", title: "Look after the list", description: "Keep this list current. Invite people who offered to help. Say what is needed next.", doneWhen: "The next needs are posted, or someone else has been invited." },
      ]
    : [
        { kind: "task", title: `Write what ${utility.name} is`, description: `Write what ${utility.name} is, in plain language. ${utility.line} Say who it is for.`, doneWhen: "A short description is posted on this Mission." },
        { kind: "task", title: "Name the first place", description: "Pick the first city, neighborhood, or community. Say why it should start there.", doneWhen: "The Mission names the first place." },
        { kind: "task", title: "List what an operator needs", description: `List what a person operating ${utility.name} needs on the first day. This is a list, not the software.`, doneWhen: "The list is posted where other people can read it." },
      ];
  fit(project.outcome, project.title, projectLimits.outcome.max);
  if (project.title.trim().length < projectLimits.title.min || project.title.trim().length > projectLimits.title.max) throw new Error("Project title length.");
  for (const item of work) {
    if (item.title.trim().length < workLimits.title.min || item.title.trim().length > workLimits.title.max) throw new Error(`${utility.name} title length: ${item.title}`);
    fit(item.description, item.title, workLimits.description.max);
    fit(item.doneWhen, item.title, workLimits.doneWhen.max);
  }
  return { project, work };
}
