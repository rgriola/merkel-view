# Coding Guidelines
- No file or class should have more than 400 lines of code.
- Code must always be ready-to-paste
- Use API's when available.
- If a feature is working do not make changes or add features without consulting dev first
- Keep code tight, if there is repetitive code make a function to be used across multiple files.
- 

# Code Suggestions 
- always note the file a suggested code snippet should be placed. I am getting better at understanding but clearity makes all the work easier. 
- Try to keep tasks and updates betweem 2-3 items, any more can make it confusing to me.
- Add comments generously.

<script async defer
  src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&callback=initMap">
</script>

# // Firestore collections
locations: {
  id: auto,
  name: string,
  state: string,
  city: string,
  lat: number,
  lng: number,
  notes: string,
  category: string,
  addedBy: string,
  dateAdded: timestamp,
  photos: array
}

users: {
  id: auto,
  email: string,
  firstName: string,
  lastName: string,
  fullName: string,
  phone: string,
  role: string,
  emailVerified: boolean,
  dateCreated: timestamp,
  dateUpdated: timestamp
}
