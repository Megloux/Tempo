console.log(JSON.stringify({schedule: schedule, instructors: instructors.map(i => ({id: i.id, name: i.name, availability: i.availability, classTypes: i.classTypes}))}, null, 2));
