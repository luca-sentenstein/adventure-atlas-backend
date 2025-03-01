/*
Project description: Trip planner website with the following features/properties:

Users can create an account which is needed to save trips (maybe make it possible to play around with the trip planner without an account and require an account only to save the trip) => for every account we have to store the password hash
A trip is divided into sections/stages
A trip and a section can have a description/notes
Every section can contain multiple locations; these locations can either be viewed as a route or a set of points, so that you can for example plan one section to be a city tour with a specific route you want to take and which attractions you want to visit
A section has a start and end datetime (can however be empty when not yet clear) which allows our website to calculate the time needed for the sections or the whole trip
You can add a cost to a section so that you can track how much the whole trip costs (fuel, accommodation, entrance fees for tourist attractions, restaurant, food etc.)
A trip can be shared with friends with support for different access rights (read-only, write, admin?)
A trip can also be made public so that people can search for public trip ideas
An integrated map which shows the trip routes/locations, allows to search places and create routes
*/

// Default Type for all entities
interface BaseEntity {
    id: number;
    createdAt: Date;
    updatedAt: Date;
}

// This is for the pins on the map
interface Location {
    x: number;
    y: number;
}

// User of our website
interface User extends BaseEntity {
    firstName: string; // maybe
    lastName: string; // maybe
    username: string;  // Do we need it?, yes to show original creator of trip with a good name
    email: string;
    passwordHash: string;
    //role: 'admin' | 'user'; // everyone is user, multiple user for testing
}

// The main class for a trip
interface Trip extends BaseEntity {
    ownerId: number;
    title: string;
    subtitle?: string;
    description?: string;
    image?: Blob; // Binary large object file
    public: boolean; // public is preferred over tripaccess
    TripStages: TripStage[]
}

// One section of a trip. A trip can have multiple sections
interface TripStage extends BaseEntity {
    title: string;
    picture: Blob;
    description?: string;
    Route: Location[] | Location // 
    displayRoute: boolean;
    tripId: number;
    cost: number;
    start: Date | null; 
    end: Date | null
}

// Connection between the trip and the user for shared trips
interface TripAccess extends BaseEntity {
    tripId: number;
    userId: number;
    accessLevel: 'read' | 'write'
}