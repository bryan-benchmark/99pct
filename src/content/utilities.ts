/**
 * Public catalog of utility communities people can start.
 * None of these are live services.
 */

export type Utility = {
  genre: string;
  name: string;
  incumbent: string;
  line: string;
};

export const helpKinds = [
  { id: "write", label: "Writing" },
  { id: "place", label: "A place" },
  { id: "people", label: "Answering people" },
  { id: "code", label: "Code" },
] as const;

export type HelpKind = (typeof helpKinds)[number]["id"];

export function utilitySlug(name: string) {
  return name.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

export function utilityBySlug(slug: string) {
  return utilities.find((item) => utilitySlug(item.name) === slug) ?? null;
}

export function utilityByName(name: string) {
  return utilities.find((item) => item.name === name) ?? null;
}

export const heroIncumbents = [
  "Uber",
  "Walmart",
  "Airbnb",
  "McDonald's",
  "DoorDash",
  "Dollar Tree",
  "Spotify",
  "Kroger",
  "Amazon",
  "Starbucks",
  "Ticketmaster",
  "Comcast",
  "Instacart",
  "Google",
  "YouTube",
  "Facebook",
  "TikTok",
  "CVS",
  "Expedia",
  "United",
  "Etsy",
  "Apple",
  "Upwork",
  "Wells Fargo",
  "Yelp",
  "Exxon",
  "Nike",
  "Disney",
] as const;

export const utilityBeneficiaries = "People who use it and people who operate it";

export const utilities: readonly Utility[] = [
  { genre: "Getting around", name: "Rideshare 99", incumbent: "Uber", line: "A ride across town." },
  { genre: "Getting around", name: "Delivery 99", incumbent: "DoorDash", line: "Food and parcels brought to a door." },
  { genre: "Getting around", name: "Grocery 99", incumbent: "Instacart", line: "Groceries from a store nearby." },
  { genre: "Getting around", name: "Bikes 99", incumbent: "Lime", line: "A bike or scooter for a short trip." },
  { genre: "Getting around", name: "Transit 99", incumbent: "a transit app", line: "When the next bus or train is coming." },
  { genre: "Getting around", name: "Parking 99", incumbent: "SpotHero", line: "A place to leave a car." },
  { genre: "Getting around", name: "Car share 99", incumbent: "Turo", line: "A car for a day or a weekend." },
  { genre: "Getting around", name: "Charging 99", incumbent: "a charging network", line: "A place to charge a car." },
  { genre: "Getting around", name: "Tow 99", incumbent: "a tow network", line: "A tow when a car stops." },
  { genre: "Getting around", name: "Flights 99", incumbent: "United", line: "A seat on a plane." },
  { genre: "Getting around", name: "Fuel 99", incumbent: "Exxon", line: "Fuel for a trip." },
  { genre: "Getting around", name: "Mechanic 99", incumbent: "a mechanic directory", line: "A person who works on cars." },
  { genre: "A place to be", name: "Stay 99", incumbent: "Airbnb", line: "A place to sleep in someone's home." },
  { genre: "A place to be", name: "Rooms 99", incumbent: "SpareRoom", line: "A room, or a person to share one." },
  { genre: "A place to be", name: "Storage 99", incumbent: "Neighbor", line: "A spare garage or closet, shared." },
  { genre: "A place to be", name: "Rentals 99", incumbent: "Zillow", line: "People looking for a home to rent, and people offering one." },
  { genre: "A place to be", name: "Camping 99", incumbent: "Hipcamp", line: "A place to sleep outside." },
  { genre: "Food", name: "Reservations 99", incumbent: "OpenTable", line: "A table at a restaurant." },
  { genre: "Food", name: "Farm box 99", incumbent: "a farm box service", line: "Food from people who grow it." },
  { genre: "Food", name: "Food rescue 99", incumbent: "Too Good To Go", line: "Food that would otherwise be thrown away." },
  { genre: "Food", name: "Recipes 99", incumbent: "a recipe site", line: "How to cook a meal, shared by the people who cook it." },
  { genre: "Food", name: "Meals 99", incumbent: "McDonald's", line: "A hot meal nearby." },
  { genre: "Food", name: "Coffee 99", incumbent: "Starbucks", line: "A cup of coffee nearby." },
  { genre: "Home and care", name: "Errands 99", incumbent: "Taskrabbit", line: "A person for an errand or a small job." },
  { genre: "Home and care", name: "Cleaning 99", incumbent: "Handy", line: "Help keeping a home." },
  { genre: "Home and care", name: "Repairs 99", incumbent: "Angi", line: "A person who can fix a thing." },
  { genre: "Home and care", name: "Laundry 99", incumbent: "a laundry service", line: "Wash and fold nearby." },
  { genre: "Home and care", name: "Pets 99", incumbent: "Rover", line: "Care for an animal." },
  { genre: "Home and care", name: "Childcare 99", incumbent: "Care.com", line: "A community around care for children. Not a childcare provider." },
  { genre: "Home and care", name: "Elder help 99", incumbent: "Care.com", line: "A community around help for older people. Not a care provider." },
  { genre: "Home and care", name: "Find care 99", incumbent: "Zocdoc", line: "A way to find a clinic. Not medical care." },
  { genre: "Home and care", name: "Appointments 99", incumbent: "Booksy", line: "A haircut or another ordinary appointment." },
  { genre: "Home and care", name: "Fitness 99", incumbent: "ClassPass", line: "A class to move in." },
  { genre: "Home and care", name: "Pharmacy 99", incumbent: "CVS", line: "A prescription counter nearby. Not medical care." },
  { genre: "The neighborhood", name: "Local 99", incumbent: "Yelp", line: "What neighbors think is good nearby." },
  { genre: "The neighborhood", name: "Classifieds 99", incumbent: "Craigslist", line: "Something to sell, or something you need." },
  { genre: "The neighborhood", name: "Events 99", incumbent: "Eventbrite", line: "Something happening near you." },
  { genre: "The neighborhood", name: "Tickets 99", incumbent: "Ticketmaster", line: "A ticket to a show or a game." },
  { genre: "The neighborhood", name: "Maps 99", incumbent: "Google Maps", line: "How to get from one place to another." },
  { genre: "The neighborhood", name: "Neighbors 99", incumbent: "Nextdoor", line: "A block of people talking to each other." },
  { genre: "The neighborhood", name: "Volunteers 99", incumbent: "VolunteerMatch", line: "A way to help near you." },
  { genre: "The neighborhood", name: "Recycling 99", incumbent: "a recycling guide", line: "Where a thing should go when you are done with it." },
  { genre: "The neighborhood", name: "Parks 99", incumbent: "Disney", line: "A day out, kept by the people who run it." },
  { genre: "Culture", name: "Music 99", incumbent: "Spotify", line: "Music, with the people who make it." },
  { genre: "Culture", name: "Podcasts 99", incumbent: "Spotify", line: "Shows to listen to." },
  { genre: "Culture", name: "Books 99", incumbent: "Audible", line: "A book to read or hear." },
  { genre: "Culture", name: "Social Media 99", incumbent: "TikTok", line: "Post the way you already do. It puts each thing in the right format." },
  { genre: "Culture", name: "Video 99", incumbent: "YouTube", line: "A place to publish and to watch." },
  { genre: "Culture", name: "Photos 99", incumbent: "Instagram", line: "Pictures people choose to share." },
  { genre: "Culture", name: "Feed 99", incumbent: "Facebook", line: "A way to reach people you know." },
  { genre: "Culture", name: "News 99", incumbent: "a news chain", line: "Reporting a community can support directly." },
  { genre: "Culture", name: "Gigs 99", incumbent: "a venue listing", line: "A stage for someone who plays nearby." },
  { genre: "Culture", name: "Radio 99", incumbent: "a radio app", line: "Stations and shows, in the open." },
  { genre: "Work", name: "Freelance 99", incumbent: "Upwork", line: "Hire a person, or be hired." },
  { genre: "Work", name: "Jobs 99", incumbent: "Indeed", line: "An open role, posted by the people hiring." },
  { genre: "Work", name: "Coworking 99", incumbent: "WeWork", line: "A shared room to work in." },
  { genre: "Buying and selling", name: "Marketplace 99", incumbent: "Amazon", line: "Ordinary things, bought and sold between people." },
  { genre: "Buying and selling", name: "Store 99", incumbent: "Walmart", line: "A store for what a household needs." },
  { genre: "Buying and selling", name: "Grocer 99", incumbent: "Kroger", line: "A grocery store, run by the people who work there." },
  { genre: "Buying and selling", name: "Basics 99", incumbent: "Dollar Tree", line: "Ordinary things, built to last." },
  { genre: "Buying and selling", name: "Clothes 99", incumbent: "Nike", line: "Clothes made to last." },
  { genre: "Buying and selling", name: "Handmade 99", incumbent: "Etsy", line: "A thing a person made." },
  { genre: "Buying and selling", name: "Resale 99", incumbent: "Depop", line: "Clothes and goods passed on." },
  { genre: "Buying and selling", name: "Secondhand 99", incumbent: "eBay", line: "A sale between two people." },
  { genre: "Learning", name: "Courses 99", incumbent: "Udemy", line: "A class someone teaches." },
  { genre: "Learning", name: "Tutoring 99", incumbent: "Wyzant", line: "Help learning one subject." },
  { genre: "Learning", name: "Language 99", incumbent: "Duolingo", line: "Practice a language with other people." },
  { genre: "Travel", name: "Trips 99", incumbent: "Expedia", line: "A trip, without one company sitting in the middle." },
  { genre: "Travel", name: "Activities 99", incumbent: "Viator", line: "Something to do in a place you are visiting." },
  { genre: "Everyday tools", name: "Mail 99", incumbent: "Gmail", line: "Mail that belongs to the person using it." },
  { genre: "Everyday tools", name: "Internet 99", incumbent: "Comcast", line: "A connection that belongs to the person using it." },
  { genre: "Everyday tools", name: "Search 99", incumbent: "Google", line: "A way to find something." },
  { genre: "Everyday tools", name: "Phone 99", incumbent: "Apple", line: "A phone the owner can open and repair." },
  { genre: "Everyday tools", name: "Bank 99", incumbent: "Wells Fargo", line: "A community around keeping money. Not a bank." },
  { genre: "Everyday tools", name: "Chat 99", incumbent: "Slack", line: "A room where a group can talk." },
  { genre: "Everyday tools", name: "Docs 99", incumbent: "Google Docs", line: "A document a group can write together." },
  { genre: "Everyday tools", name: "Calendar 99", incumbent: "Google Calendar", line: "Shared time." },
  { genre: "Everyday tools", name: "Design 99", incumbent: "Canva", line: "A page, a poster, or a simple picture." },
  { genre: "Everyday tools", name: "Notes 99", incumbent: "Notion", line: "Notes that stay with the person who wrote them." },
  { genre: "Everyday tools", name: "Files 99", incumbent: "Dropbox", line: "Files a person can keep and share." },
  { genre: "Everyday tools", name: "Sites 99", incumbent: "Squarespace", line: "A simple site for a person or a shop." },
  { genre: "Everyday tools", name: "Printing 99", incumbent: "a print shop", line: "Print a thing nearby." },
  { genre: "In common", name: "Tool library 99", incumbent: "a tool library", line: "Borrow a tool instead of buying it." },
  { genre: "In common", name: "Repair cafe 99", incumbent: "a repair cafe", line: "Fix a thing, with other people." },
  { genre: "In common", name: "Mutual aid 99", incumbent: "a mutual aid group", line: "Neighbors helping neighbors." },
  { genre: "In common", name: "Garden 99", incumbent: "a community garden", line: "A place to grow food together." },
  { genre: "In common", name: "Library of things 99", incumbent: "a library of things", line: "Borrow what a household only needs sometimes." },
  { genre: "In common", name: "Moving 99", incumbent: "a moving marketplace", line: "Help getting from one home to another." },
  { genre: "In common", name: "Shipping 99", incumbent: "Pirate Ship", line: "Send a package." },
];

export function utilityPurpose(utility: Utility) {
  return `Build ${utility.name} in the open. ${utility.line} The people who operate it and the people who build it are who it is for.`;
}

export function startUtilityPath(utility: Utility) {
  const params = new URLSearchParams({
    name: utility.name,
    purpose: utilityPurpose(utility),
    beneficiaries: utilityBeneficiaries,
  });
  return `/missions/new?${params.toString()}`;
}
