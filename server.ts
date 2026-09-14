import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { registerCustomQuizRoutes } from "./src/server/customQuizzes";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "25mb" }));
const UPLOADS_DIR = path.join(process.cwd(), "data", "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use("/api/uploads", express.static(UPLOADS_DIR));

// ==========================================
// PERSISTENT USER & PROFILE DATABASE
// ==========================================
interface StoredUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  salt: string;
  age: number | string;
  preferredLanguage: string;
  profilePicture: string;
  favoriteActivities: string;
  hobbies: string;
  frequentlyVisitedPlaces: string;
  importantInformation: string;
  profileCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

// In-memory active session tokens mapped to user ID
const activeSessions = new Map<string, { userId: string; expiresAt: number }>();

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
}

function verifyPassword(password: string, salt: string, storedHash: string): boolean {
  try {
    const hash = hashPassword(password, salt);
    return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(storedHash, "hex"));
  } catch (err) {
    return false;
  }
}

function loadUsers(): StoredUser[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(USERS_FILE)) {
      // Seed initial sample user with complete profile for immediate testing/login
      const demoSalt = crypto.randomBytes(16).toString("hex");
      const demoUser: StoredUser = {
        id: "usr_demo_1",
        name: "Rahul Sharma",
        email: "rahul@memorymate.ai",
        passwordHash: hashPassword("password123", demoSalt),
        salt: demoSalt,
        age: 68,
        preferredLanguage: "English",
        profilePicture: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80",
        favoriteActivities: "Morning walks, reading classics, gardening",
        hobbies: "Crossword puzzles, chess, listening to instrumental classical music",
        frequentlyVisitedPlaces: "City botanical gardens, public library, St. Peter's community hall",
        importantInformation: "Wife's name is Maya, daughter Priya visits on Sunday mornings, morning tea at 8:00 AM",
        profileCompleted: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      fs.writeFileSync(USERS_FILE, JSON.stringify([demoUser], null, 2), "utf-8");
      return [demoUser];
    }
    const data = fs.readFileSync(USERS_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error loading users file:", err);
    return [];
  }
}

function saveUsers(users: StoredUser[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tempFile = `${USERS_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(users, null, 2), "utf-8");
    fs.renameSync(tempFile, USERS_FILE);
  } catch (err) {
    console.error("Error saving users file:", err);
  }
}

function sanitizeUser(user: StoredUser) {
  const { passwordHash, salt, ...safeUser } = user;
  return safeUser;
}

function generateToken(userId: string): string {
  const token = `mm_sess_${crypto.randomBytes(32).toString("hex")}`;
  // 30 days expiration
  activeSessions.set(token, {
    userId,
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
  });
  return token;
}

function getUserFromToken(token: string | undefined): StoredUser | null {
  if (!token) return null;
  const session = activeSessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    if (session) activeSessions.delete(token);
    return null;
  }
  const users = loadUsers();
  return users.find((u) => u.id === session.userId) || null;
}

// ==========================================
// AUTHENTICATION API ROUTES
// ==========================================

// 1. Signup Route
app.post("/api/auth/signup", (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Full Name is required." });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ error: "Please enter a valid email address." });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long." });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match." });
    }

    const users = loadUsers();
    const normalizedEmail = email.trim().toLowerCase();
    const existing = users.find((u) => u.email.toLowerCase() === normalizedEmail);

    if (existing) {
      return res.status(400).json({ error: "An account with this email already exists. Please log in." });
    }

    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash = hashPassword(password, salt);
    const now = new Date().toISOString();

    const newUser: StoredUser = {
      id: `usr_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      salt,
      age: "",
      preferredLanguage: "English",
      profilePicture: "",
      favoriteActivities: "",
      hobbies: "",
      frequentlyVisitedPlaces: "",
      importantInformation: "",
      profileCompleted: false, // Strictly false for new accounts!
      createdAt: now,
      updatedAt: now,
    };

    users.push(newUser);
    saveUsers(users);

    const token = generateToken(newUser.id);

    return res.status(201).json({
      message: "Account created successfully",
      user: sanitizeUser(newUser),
      token,
    });
  } catch (err: any) {
    console.error("Signup error:", err);
    return res.status(500).json({ error: "Failed to create account. Please try again." });
  }
});

// 2. Login Route
app.post("/api/auth/login", (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Please provide both email and password." });
    }

    const users = loadUsers();
    const normalizedEmail = email.trim().toLowerCase();
    const user = users.find((u) => u.email.toLowerCase() === normalizedEmail);

    if (!user || !verifyPassword(password, user.salt, user.passwordHash)) {
      return res.status(401).json({ error: "Invalid email or password. Please check your credentials." });
    }

    const token = generateToken(user.id);

    return res.json({
      message: "Login successful",
      user: sanitizeUser(user),
      token,
    });
  } catch (err: any) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "An error occurred during login. Please try again." });
  }
});

// 3. Current Authenticated User ('me')
app.get("/api/auth/me", (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : undefined;
    const user = getUserFromToken(token);

    if (!user) {
      return res.status(401).json({ error: "Session expired or unauthorized. Please log in." });
    }

    return res.json({ user: sanitizeUser(user) });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to verify session." });
  }
});

// 4. Update Profile
app.put("/api/auth/profile", (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : undefined;
    const user = getUserFromToken(token);

    if (!user) {
      return res.status(401).json({ error: "Unauthorized. Please log in again." });
    }

    const {
      name,
      age,
      preferredLanguage,
      profilePicture,
      favoriteActivities,
      hobbies,
      frequentlyVisitedPlaces,
      importantInformation,
      profileCompleted,
    } = req.body;

    const users = loadUsers();
    const userIndex = users.findIndex((u) => u.id === user.id);
    if (userIndex === -1) {
      return res.status(404).json({ error: "User account not found." });
    }

    const targetUser = users[userIndex];
    if (name !== undefined) targetUser.name = String(name).trim();
    if (age !== undefined) targetUser.age = age;
    if (preferredLanguage !== undefined) targetUser.preferredLanguage = String(preferredLanguage);
    if (profilePicture !== undefined) targetUser.profilePicture = String(profilePicture);
    if (favoriteActivities !== undefined) targetUser.favoriteActivities = String(favoriteActivities);
    if (hobbies !== undefined) targetUser.hobbies = String(hobbies);
    if (frequentlyVisitedPlaces !== undefined) targetUser.frequentlyVisitedPlaces = String(frequentlyVisitedPlaces);
    if (importantInformation !== undefined) targetUser.importantInformation = String(importantInformation);
    if (profileCompleted !== undefined) targetUser.profileCompleted = Boolean(profileCompleted);
    targetUser.updatedAt = new Date().toISOString();

    users[userIndex] = targetUser;
    saveUsers(users);

    return res.json({
      message: "Profile updated successfully",
      user: sanitizeUser(targetUser),
    });
  } catch (err: any) {
    console.error("Profile update error:", err);
    return res.status(500).json({ error: "Failed to update profile." });
  }
});

// 5. Forgot Password
app.post("/api/auth/forgot-password", (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Please enter your registered email address." });
  }
  const users = loadUsers();
  const normalizedEmail = email.trim().toLowerCase();
  const user = users.find((u) => u.email.toLowerCase() === normalizedEmail);

  if (!user) {
    return res.status(404).json({ error: "No account found with this email address." });
  }

  const resetCode = `MM-${Math.floor(1000 + Math.random() * 9000)}`;
  return res.json({
    message: `Password reset verification sent. For demonstration, your recovery code is: ${resetCode}`,
    resetCode,
  });
});

// 6. Logout Route
app.post("/api/auth/logout", (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : undefined;
  if (token) {
    activeSessions.delete(token);
  }
  return res.json({ message: "Logged out successfully" });
});

// Lazy initialization of Gemini AI
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasApiKey: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY"),
  });
});

// AI Quiz Generation Endpoint
app.post("/api/ai/generate-quiz", async (req, res) => {
  try {
    const { profile, routine, family, audioStories, forgottenTopics } = req.body;
    const ai = getGeminiClient();

    if (ai) {
      const prompt = `You are a specialized cognitive care AI assistant helping create a personalized, comforting, and cognitively stimulating memory recall quiz for ${profile?.name || "the user"} (age: ${profile?.age || "senior"}).
Context:
- Daily Routine & Facts: ${JSON.stringify(routine || [])}
- Family Information: ${JSON.stringify(family || [])}
- Recent Audio Stories / Experiences: ${JSON.stringify(audioStories || [])}
- Frequently Forgotten Topics to prioritize with gentle reinforcement: ${JSON.stringify(forgottenTopics || [])}

Create 5 personalized questions spanning diverse types:
1. Multiple Choice (4 realistic options)
2. True/False
3. Short Answer / Recall
4. Sequence / Chronological Order (3-4 steps)
5. Recall Question based on a personal detail, family memory, or recent audio story

Respond in strictly valid JSON matching this schema:
[
  {
    "id": "q_unique_id",
    "type": "multiple_choice" | "true_false" | "short_answer" | "sequence" | "recall",
    "category": "Daily Routine" | "Family & Friends" | "Audio Memories" | "Personal Preferences" | "Chronology",
    "question": "Clear, friendly question text",
    "options": ["Option A", "Option B", "Option C", "Option D"], // for multiple_choice & true_false
    "correctAnswer": "Exact correct answer string",
    "sequenceItems": ["Step 1", "Step 2", "Step 3"], // ONLY for sequence type, in correct chronological order
    "explanation": "Gentle, supportive explanation affirming the memory",
    "memoryFactSource": "Brief note on which personal detail this came from"
  }
]`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.7,
        },
      });

      const text = response.text || "[]";
      try {
        const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const questions = JSON.parse(cleaned);
        return res.json({ success: true, source: "gemini", questions });
      } catch (e) {
        console.error("Failed to parse Gemini quiz output, falling back:", e);
      }
    }

    // Heuristic fallback if no API key or parse error
    return res.json({
      success: true,
      source: "local-heuristic",
      questions: generateHeuristicQuiz(profile, routine, family, audioStories, forgottenTopics),
    });
  } catch (err: any) {
    console.error("Error in /api/ai/generate-quiz:", err);
    return res.status(500).json({ error: err.message || "Quiz generation failed" });
  }
});

// AI Audio Story Analysis Endpoint
app.post("/api/ai/analyze-story", async (req, res) => {
  try {
    const { storyText, title, date } = req.body;
    const ai = getGeminiClient();

    if (ai && storyText) {
      const prompt = `Analyze this spoken memory story from a senior user:
Title: "${title || "Today's Story"}"
Date: "${date || "Today"}"
Story Text: "${storyText}"

Extract non-sensitive personal memory facts and formulate 2 memory recall questions for future cognitive quizzes.
Return strictly valid JSON with this schema:
{
  "summary": "Brief 1-sentence warm summary of what happened",
  "entities": {
    "people": ["Name or role, e.g. brother Rahul"],
    "places": ["e.g. Oak Street market"],
    "activities": ["e.g. bought apples, read mystery novel"],
    "objects": ["e.g. book, tea, yellow flowers"],
    "sentiment": "Warm, Nostalgic, Happy, etc."
  },
  "extractedFacts": [
    "Fact 1 that can be tested later",
    "Fact 2 that can be tested later"
  ],
  "suggestedRecallQuestions": [
    {
      "question": "Friendly question",
      "expectedAnswer": "Brief answer",
      "type": "multiple_choice" | "recall",
      "options": ["A", "B", "C", "D"]
    }
  ]
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const text = response.text || "{}";
      try {
        const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const analysis = JSON.parse(cleaned);
        return res.json({ success: true, source: "gemini", analysis });
      } catch (e) {
        console.error("Error parsing story analysis JSON:", e);
      }
    }

    // Heuristic analysis fallback
    const analysis = analyzeStoryHeuristic(storyText);
    return res.json({ success: true, source: "local-heuristic", analysis });
  } catch (err: any) {
    console.error("Error in /api/ai/analyze-story:", err);
    return res.status(500).json({ error: err.message || "Story analysis failed" });
  }
});

// AI Answer Evaluation Endpoint (for nuance evaluation in short answers)
app.post("/api/ai/evaluate-answer", async (req, res) => {
  try {
    const { question, expectedAnswer, userAnswer, questionType } = req.body;
    const ai = getGeminiClient();

    if (ai && question && expectedAnswer && userAnswer) {
      const prompt = `Evaluate whether the user's answer to this memory recall question is substantively correct.
Question: "${question}"
Expected Fact: "${expectedAnswer}"
User Provided Answer: "${userAnswer}"

Be forgiving of minor typos, colloquialisms, or synonymous phrasings.
Respond in valid JSON:
{
  "isCorrect": boolean,
  "accuracyPercent": number (0 to 100),
  "feedback": "Warm, encouraging 1-sentence response suitable for a senior memory app"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const text = response.text || "{}";
      try {
        const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const evalResult = JSON.parse(cleaned);
        return res.json({ success: true, source: "gemini", result: evalResult });
      } catch (e) {
        console.error("Failed to parse eval JSON:", e);
      }
    }

    // Heuristic string similarity
    const u = (userAnswer || "").trim().toLowerCase();
    const e = (expectedAnswer || "").trim().toLowerCase();
    const isCorrect = u === e || u.includes(e) || e.includes(u);
    return res.json({
      success: true,
      source: "local-heuristic",
      result: {
        isCorrect,
        accuracyPercent: isCorrect ? 100 : (u.length > 2 && (e.slice(0, 3) === u.slice(0, 3)) ? 65 : 0),
        feedback: isCorrect
          ? "Spot on! That matches your personal memory perfectly."
          : `That was a great try! The detail recorded was "${expectedAnswer}".`,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Heuristic quiz generator used when Gemini is not connected or as instant offline generator
function generateHeuristicQuiz(profile: any, routine: any[], family: any[], audioStories: any[], forgottenTopics: any[]) {
  const questions: any[] = [];
  const userName = profile?.name || "Friend";

  // Check forgotten items first (adaptive spaced repetition!)
  if (forgottenTopics && forgottenTopics.length > 0) {
    const forgotten = forgottenTopics[0];
    questions.push({
      id: "q_adapt_" + Date.now(),
      type: "multiple_choice",
      category: "Reinforcement Recall",
      question: `Let's gently revisit this: ${forgotten.topic || "What is a key routine detail?"}`,
      options: [
        forgotten.correctAnswer || "8:00 AM",
        "10:30 AM",
        "7:00 PM",
        "None of these",
      ],
      correctAnswer: forgotten.correctAnswer || "8:00 AM",
      explanation: `Wonderful reinforcement! Remembering this keeps your rhythm sharp.`,
      memoryFactSource: `Reinforcement from previously missed topic (${forgotten.topic})`,
    });
  }

  // Routine question
  const wakeUpFact = (routine || []).find((r: any) => r.key === "wake_time" || r.question?.toLowerCase().includes("wake"));
  if (wakeUpFact) {
    questions.push({
      id: "q_wake_" + Date.now(),
      type: "multiple_choice",
      category: "Daily Routine",
      question: `Around what time do you usually start your morning?`,
      options: [
        wakeUpFact.answer || "7:30 AM",
        "6:00 AM",
        "9:30 AM",
        "11:00 AM",
      ],
      correctAnswer: wakeUpFact.answer || "7:30 AM",
      explanation: `You noted that you start your day at ${wakeUpFact.answer}. Maintaining a regular sleep schedule boosts cognitive recall.`,
      memoryFactSource: "Your morning routine entry",
    });
  } else {
    questions.push({
      id: "q_routine_seq_" + Date.now(),
      type: "sequence",
      category: "Chronology",
      question: "Put this typical morning sequence in the correct chronological order:",
      sequenceItems: ["Wake up & stretch", "Enjoy morning herbal tea", "Water the balcony flowers"],
      correctAnswer: "Wake up & stretch -> Enjoy morning herbal tea -> Water the balcony flowers",
      explanation: "Chronological sequencing engages the brain's executive planning function.",
      memoryFactSource: "Your daily morning habits",
    });
  }

  // Family Question
  const fam = family && family.length > 0 ? family[0] : null;
  if (fam) {
    questions.push({
      id: "q_fam_" + Date.now(),
      type: "recall",
      category: "Family & Friends",
      question: `What is the relationship between you and ${fam.name}?`,
      options: [fam.relationship || "Daughter", "Cousin", "Neighbor", "Dentist"],
      correctAnswer: fam.relationship || "Daughter",
      explanation: `${fam.name} is your cherished ${fam.relationship}. ${fam.sharedMemories ? 'Remembering: ' + fam.sharedMemories : ''}`,
      memoryFactSource: `Family circle: ${fam.name}`,
    });
  } else {
    questions.push({
      id: "q_fam_generic_" + Date.now(),
      type: "true_false",
      category: "Family & Friends",
      question: "True or False: Staying in touch with close family and friends stimulates social memory pathways.",
      options: ["True", "False"],
      correctAnswer: "True",
      explanation: "Social engagement is proven by neuroscientists to be one of the best cognitive protectors.",
      memoryFactSource: "Cognitive wellness research",
    });
  }

  // Audio story question
  const story = audioStories && audioStories.length > 0 ? audioStories[0] : null;
  if (story) {
    questions.push({
      id: "q_story_" + Date.now(),
      type: "multiple_choice",
      category: "Audio Memories",
      question: `In your recent audio story "${story.title}", what memorable event did you record?`,
      options: [
        story.summary || "You walked in the park and picked fresh flowers",
        "You fixed the garage bicycle",
        "You watched an action thriller movie",
        "You flew on an airplane to France",
      ],
      correctAnswer: story.summary || "You walked in the park and picked fresh flowers",
      explanation: `From your story recorded on ${story.date || "recently"}. Audio recall strengthens episodic memory connections.`,
      memoryFactSource: `Audio Story: ${story.title}`,
    });
  } else {
    questions.push({
      id: "q_story_sample_" + Date.now(),
      type: "recall",
      category: "Audio Memories",
      question: "What is your favorite relaxing afternoon activity?",
      options: ["Reading a book in the sunroom", "Running a marathon", "Operating heavy machinery", "Scuba diving"],
      correctAnswer: "Reading a book in the sunroom",
      explanation: "Quiet relaxing activities restore cognitive energy.",
      memoryFactSource: "Your favorite activities survey",
    });
  }

  // Sequence Question
  questions.push({
    id: "q_seq_day_" + Date.now(),
    type: "sequence",
    category: "Chronology",
    question: "Arrange these typical daily parts in proper order:",
    sequenceItems: ["Morning breakfast & medications", "Afternoon walk or crossword puzzle", "Evening call with family & reading"],
    correctAnswer: "Morning breakfast & medications -> Afternoon walk or crossword puzzle -> Evening call with family & reading",
    explanation: "Structuring your daily routine assists procedural and prospective memory.",
    memoryFactSource: "Daily routine structure",
  });

  return questions;
}

// Heuristic story analyzer
function analyzeStoryHeuristic(text: string) {
  const words = (text || "").toLowerCase();
  const people: string[] = [];
  const places: string[] = [];
  const activities: string[] = [];

  if (words.includes("brother") || words.includes("rahul")) people.push("Brother Rahul");
  if (words.includes("daughter") || words.includes("maya") || words.includes("sarah")) people.push("Daughter");
  if (words.includes("friend") || words.includes("martha") || words.includes("neighbor")) people.push("Friend/Neighbor Martha");

  if (words.includes("market") || words.includes("store") || words.includes("shop")) places.push("Local Market");
  if (words.includes("park") || words.includes("garden")) places.push("Park / Garden");
  if (words.includes("library") || words.includes("cafe")) places.push("Library / Cafe");

  if (words.includes("bought") || words.includes("buy") || words.includes("book")) activities.push("Bought books / fresh items");
  if (words.includes("tea") || words.includes("coffee")) activities.push("Enjoyed afternoon tea");
  if (words.includes("walk") || words.includes("stroll")) activities.push("Took a refreshing walk");

  if (people.length === 0) people.push("Family / Loved ones");
  if (places.length === 0) places.push("Neighborhood garden");
  if (activities.length === 0) activities.push("Peaceful daily reflection");

  return {
    summary: text.length > 120 ? text.slice(0, 117) + "..." : text || "A peaceful day filled with cherished moments.",
    entities: {
      people,
      places,
      activities,
      objects: ["Journal", "Books", "Cup of tea"],
      sentiment: "Warm and reflective",
    },
    extractedFacts: [
      `User noted spending time around: ${places.join(", ")}`,
      `Mentioned connection with: ${people.join(", ")}`,
      `Engaged in: ${activities.join(", ")}`,
    ],
    suggestedRecallQuestions: [
      {
        question: `In your story about "${places[0] || "your day"}", who or what was prominent?`,
        expectedAnswer: people[0] || "Loved ones",
        type: "recall",
        options: [people[0] || "Loved ones", "An unknown stranger", "A repairman", "Nobody"],
      },
      {
        question: `What activity did you mention in your recorded story?`,
        expectedAnswer: activities[0] || "Took a walk",
        type: "multiple_choice",
        options: [activities[0] || "Took a walk", "Went skydiving", "Rebuilt an engine", "Attended a rock concert"],
      },
    ],
  };
}

// Register Custom Quiz Builder API Routes
registerCustomQuizRoutes(app, getUserFromToken, getGeminiClient);

async function startServer() {
  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MindRecall AI server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
