import type { HelpKind, Utility } from "@/content/utilities";
import { projectLimits, workLimits, type ProjectDraft, type WorkDraft } from "./model";

const featured = "Rideshare 99";
const social = "Social Media 99";

function fit(value: string, label: string, max: number) {
  if (value.trim().length < 8 || value.trim().length > max) throw new Error(`${label} is ${value.trim().length} characters.`);
  return value;
}

export function helpForPiece(title: string): HelpKind {
  const text = title.toLowerCase();
  if (text.startsWith("look after")) return "people";
  if (text.startsWith("name the first")) return "place";
  return "write";
}

export function firstWeek(utility: Utility): { project: ProjectDraft; work: WorkDraft[] } {
  const project: ProjectDraft = {
    title: "First week",
    outcome: utility.name === featured
      ? "A plain description, a first city, and lists of what riders and drivers need."
      : utility.name === social
        ? "A plain description, the formats a post can take, and a sketch of the upload."
        : `A plain description of ${utility.name}, the first place it starts, and what an operator needs.`,
  };
  const work: WorkDraft[] = utility.name === featured
    ? [
        { kind: "task", title: "Write the one-page description", description: "One page a rider and a driver can both read. What the ride is, and that the money stays with the people in the car, in that city.", doneWhen: "A rider and a driver can both read the page, and it says the money stays in that city." },
        { kind: "task", title: "Name the first city", description: "Name one city. Say why a person there would take a ride, or give one, before a second city exists.", doneWhen: "One city is named, and why people there would try it first." },
        { kind: "task", title: "List what a driver needs", description: "Three things a driver has on day one: who the rider is, what they are paid, and how to get help.", doneWhen: "A driver can read who the rider is, what they are paid, and how to get help." },
        { kind: "task", title: "List what a rider needs", description: "Three things a rider knows before they get in: who is driving, what it costs, and how to get help.", doneWhen: "A rider can read who is driving, what it costs, and how to get help." },
        { kind: "task", title: "Sketch the first screen", description: "Where you are, where you are going, what it costs, and who keeps the money. A sketch on paper is enough.", doneWhen: "A sketch shows where you are, where you are going, the cost, and who keeps the money." },
        { kind: "role", title: "Look after the list", description: "People who raised a hand are invited to their piece. Keep the list honest. Say what is needed next.", doneWhen: "The next piece is named, or someone who offered to help has been invited." },
      ]
    : utility.name === social
    ? [
        { kind: "task", title: "Write the one-page description", description: "Write what Social Media 99 is, in plain language. A person uploads the way they already post. It puts that post into the right format: a photo, a short video, a long video, or a note. Say what changes when the people who make the posts keep the value.", doneWhen: "A one-page description is posted on this Mission." },
        { kind: "task", title: "Name the formats", description: "Name the formats a post can become. Start with a photo, a short video, a long video, and a note. Say how a person can tell which is which.", doneWhen: "The formats are posted where other people can read them." },
        { kind: "task", title: "Name the first community", description: "Pick the first people this is for. A city, a scene, or a kind of maker. Say why they would post here before anyone else does.", doneWhen: "The Mission names the first community and why." },
        { kind: "task", title: "Sketch the upload", description: "Draw or describe the upload. It should feel like posting somewhere they already use: a picture, a video, or words. Sorting happens after they post.", doneWhen: "The sketch is posted or described on this Mission." },
        { kind: "role", title: "Look after the list", description: "People who raised a hand are invited to their piece. Keep this list current. Say what is needed next.", doneWhen: "The next needs are posted, or someone else has been invited." },
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
