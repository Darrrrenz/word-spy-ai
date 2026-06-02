export const WORDS = [
  // General objects
  "apple", "book", "chair", "table", "window", "door", "mirror", "clock",
  "lamp", "phone", "camera", "wallet", "ticket", "bottle", "key", "paper",
  "pencil", "backpack", "umbrella", "blanket", "candle", "button", "ring",
  "coin", "map", "letter", "box", "basket", "rope", "ladder", "bell",
  "brush", "soap", "towel", "pillow", "plate", "spoon", "fork", "knife",
  "cup", "glass", "bucket", "chain", "lock", "helmet", "shoe", "jacket",
  "shirt", "hat", "watch", "bag", "notebook", "folder", "poster", "stamp",
  "envelope", "package", "remote", "speaker", "microphone", "radio", "television",
  "printer", "scissors", "tape", "glue", "magnet", "needle", "thread", "shelf",
  "drawer", "cabinet", "carpet", "curtain", "paint", "canvas", "frame", "statue",

  // Nature
  "river", "ocean", "mountain", "forest", "desert", "island", "beach",
  "garden", "flower", "tree", "leaf", "storm", "snow", "rain", "cloud",
  "moon", "star", "sun", "planet", "fire", "stone", "diamond", "volcano",
  "cave", "valley", "lake", "waterfall", "wind", "shadow", "light",
  "thunder", "lightning", "rainbow", "field", "meadow", "grass", "soil",
  "sand", "rock", "cliff", "hill", "glacier", "reef", "coral", "wave",
  "tide", "stream", "pond", "swamp", "jungle", "branch", "root", "seed",
  "fruit", "berry", "mushroom", "vine", "bamboo", "pine", "oak", "maple",
  "rose", "tulip", "lily", "sunflower", "orchid", "fog", "mist", "frost",

  // Technology
  "robot", "server", "database", "browser", "keyboard", "screen", "mouse",
  "tablet", "battery", "network", "signal", "internet", "password",
  "security", "code", "program", "algorithm", "model", "search", "image",
  "satellite", "laser", "engine", "sensor", "chip", "memory", "processor",
  "website", "application", "software", "hardware", "compiler", "terminal",
  "function", "variable", "array", "object", "class", "module", "package",
  "library", "framework", "api", "router", "client", "backend", "frontend",
  "cache", "cookie", "token", "encryption", "firewall", "cloudware", "storage",
  "cluster", "container", "docker", "kubernetes", "linux", "kernel", "thread",
  "process", "script", "binary", "debugger", "console", "prompt", "dataset",
  "neuron", "transformer", "embedding", "vector", "index", "query", "pipeline",
  "automation", "camera", "vision", "simulation", "sensor", "drone", "vehicle",

  // Places
  "school", "library", "airport", "hotel", "museum", "stadium", "office",
  "hospital", "market", "castle", "bridge", "subway", "station", "bank",
  "restaurant", "theater", "park", "harbor", "factory", "university",
  "court", "farm", "village", "city", "campus", "lab", "garage", "store",
  "tower", "temple", "church", "mall", "cinema", "zoo", "aquarium", "clinic",
  "pharmacy", "bakery", "cafe", "warehouse", "workshop", "arena", "gym",
  "pool", "beach", "playground", "classroom", "dormitory", "apartment",
  "kitchen", "bedroom", "bathroom", "basement", "attic", "roof", "lobby",
  "hallway", "elevator", "parking", "highway", "street", "avenue", "tunnel",
  "border", "capital", "palace", "prison", "embassy", "laboratory", "studio",

  // People and roles
  "doctor", "teacher", "student", "lawyer", "actor", "singer", "driver",
  "chef", "artist", "engineer", "scientist", "king", "queen", "pilot",
  "coach", "player", "detective", "writer", "manager", "nurse", "farmer",
  "soldier", "police", "firefighter", "judge", "professor", "researcher",
  "designer", "developer", "programmer", "analyst", "consultant", "founder",
  "investor", "director", "president", "minister", "captain", "guard",
  "mechanic", "electrician", "plumber", "barber", "dentist", "surgeon",
  "therapist", "journalist", "photographer", "musician", "dancer", "poet",
  "author", "editor", "translator", "waiter", "cashier", "clerk", "tourist",
  "neighbor", "friend", "parent", "child", "guest", "host",

  // Food and drinks
  "coffee", "pizza", "bread", "orange", "banana", "chocolate", "cheese",
  "noodle", "rice", "burger", "sandwich", "cookie", "cake", "soup",
  "salad", "egg", "milk", "tea", "honey", "pepper", "salt", "sugar",
  "butter", "yogurt", "cream", "juice", "water", "lemon", "lime", "grape",
  "strawberry", "blueberry", "peach", "pear", "melon", "mango", "pineapple",
  "tomato", "potato", "carrot", "onion", "garlic", "lettuce", "cabbage",
  "broccoli", "corn", "bean", "pea", "mushroom", "beef", "chicken", "pork",
  "fish", "shrimp", "crab", "lobster", "sausage", "bacon", "steak", "pasta",
  "dumpling", "sushi", "taco", "curry", "fries", "icecream", "donut",

  // Sports and entertainment
  "football", "tennis", "basketball", "hockey", "badminton", "game",
  "movie", "music", "song", "guitar", "piano", "drum", "dance", "stage",
  "race", "match", "team", "score", "trophy", "ticket", "baseball",
  "volleyball", "soccer", "golf", "boxing", "wrestling", "skiing", "skating",
  "swimming", "running", "cycling", "climbing", "surfing", "fencing",
  "archery", "bowling", "chess", "poker", "dice", "cards", "boardgame",
  "puzzle", "arcade", "console", "controller", "level", "quest", "boss",
  "hero", "villain", "scene", "episode", "series", "novel", "comic",
  "cartoon", "anime", "concert", "festival", "circus", "magic", "joke",

  // Animals
  "horse", "dragon", "cat", "dog", "bird", "fish", "shark", "tiger",
  "lion", "bear", "wolf", "eagle", "snake", "whale", "rabbit", "fox",
  "monkey", "panda", "duck", "spider", "elephant", "giraffe", "zebra",
  "kangaroo", "koala", "penguin", "dolphin", "octopus", "squid", "seal",
  "turtle", "frog", "toad", "lizard", "crocodile", "alligator", "bat",
  "owl", "parrot", "swan", "goose", "chicken", "cow", "pig", "sheep",
  "goat", "deer", "moose", "camel", "donkey", "mouse", "rat", "hamster",
  "bee", "ant", "butterfly", "beetle", "mosquito", "fly",

  // Transportation
  "car", "bus", "train", "plane", "ship", "boat", "submarine", "bicycle",
  "motorcycle", "scooter", "truck", "taxi", "tram", "rocket", "helicopter",
  "ambulance", "tractor", "van", "jeep", "ferry", "canoe", "kayak",
  "skateboard", "wheelchair", "elevator", "escalator", "engine", "wheel",
  "tire", "brake", "pedal", "seatbelt", "steering", "fuel", "garage",
  "platform", "railway", "runway",

  // Abstract concepts
  "energy", "language", "science", "history", "money", "memory", "dream",
  "truth", "power", "time", "space", "risk", "chance", "secret", "future",
  "winter", "summer", "morning", "night", "idea", "logic", "reason",
  "choice", "problem", "solution", "question", "answer", "pattern",
  "system", "method", "design", "strategy", "mission", "goal", "value",
  "cost", "price", "profit", "loss", "growth", "change", "speed",
  "distance", "weight", "height", "depth", "pressure", "temperature",
  "sound", "color", "shape", "motion", "force", "balance", "order",
  "chaos", "justice", "freedom", "peace", "war", "culture", "tradition",

  // Education and work
  "exam", "lecture", "homework", "assignment", "project", "deadline",
  "resume", "interview", "meeting", "email", "report", "presentation",
  "spreadsheet", "document", "contract", "invoice", "budget", "schedule",
  "calendar", "task", "note", "file", "folder", "resume", "internship",
  "career", "company", "startup", "business", "customer", "product",
  "service", "feature", "release", "version", "feedback", "review",
  "planning", "research", "analysis", "experiment", "prototype", "demo",

  // Media and communication
  "message", "letter", "email", "chat", "call", "video", "photo", "camera",
  "microphone", "speaker", "broadcast", "channel", "stream", "podcast",
  "newspaper", "magazine", "article", "headline", "story", "rumor",
  "advertisement", "poster", "banner", "signal", "emoji", "hashtag",
  "profile", "username", "account", "notification", "comment", "reply",

  // Fantasy / game-like words
  "sword", "shield", "castle", "wizard", "dragon", "knight", "monster",
  "treasure", "potion", "spell", "quest", "dungeon", "kingdom", "crown",
  "throne", "battle", "army", "portal", "crystal", "ghost", "spirit",
  "giant", "elf", "dwarf", "pirate", "ninja", "samurai", "robot",
  "alien", "planet", "galaxy", "meteor", "comet", "spaceship"
];