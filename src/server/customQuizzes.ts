import express from "express";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { GoogleGenAI } from "@google/genai";
import {
  CustomQuiz,
  CustomQuizQuestion,
  QuizImage,
  CustomQuizAttempt,
  CustomQuizDifficulty,
  CustomQuizQuestionType,
} from "../types.js";

const DATA_DIR = path.join(process.cwd(), "data");
const UPLOADS_DIR = path.join(DATA_DIR, "uploads");
const QUIZZES_FILE = path.join(DATA_DIR, "custom_quizzes.json");
const IMAGES_FILE = path.join(DATA_DIR, "quiz_images.json");
const ATTEMPTS_FILE = path.join(DATA_DIR, "custom_quiz_attempts.json");

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Seed sample custom quiz for demo user
function seedSampleQuizzesIfEmpty() {
  if (!fs.existsSync(QUIZZES_FILE)) {
    const demoQuiz: CustomQuiz = {
      id: "quiz_sample_1",
      userId: "usr_demo_1",
      title: "Family Botanical Garden Reunion",
      description: "Cherished moments from our family reunion in the botanical garden.",
      difficulty: "medium",
      questionCount: 4,
      createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
      status: "published",
      improveFutureExercises: true,
      bestScore: 100,
      lastAttemptedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
      attemptsCount: 1,
      images: [
        {
          id: "img_sample_1",
          userId: "usr_demo_1",
          quizId: "quiz_sample_1",
          storagePath: "",
          imageUrl:
            "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&auto=format&fit=crop&q=80",
          originalFileName: "garden_gathering.jpg",
          description:
            "Family gathering in the botanical rose garden on a sunny afternoon. Daughter Maya is standing on the left wearing a light green cardigan.",
          uploadedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
        },
        {
          id: "img_sample_2",
          userId: "usr_demo_1",
          quizId: "quiz_sample_1",
          storagePath: "",
          imageUrl:
            "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&auto=format&fit=crop&q=80",
          originalFileName: "tea_pavilion.jpg",
          description:
            "Family enjoying warm chamomile tea and biscuits together inside the glasshouse tea pavilion.",
          uploadedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
        },
      ],
      questions: [
        {
          id: "q_sample_1",
          quizId: "quiz_sample_1",
          question: "In the rose garden photograph, where was daughter Maya standing?",
          questionType: "multiple_choice",
          options: ["On the left side", "In the center", "On the far right", "Behind the stone bench"],
          correctAnswer: "On the left side",
          explanation: "Maya was standing joyfully on the left side of the garden rose arbor.",
          hint: "Look toward the left side of the photo.",
          imageId: "img_sample_1",
          imageUrl:
            "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&auto=format&fit=crop&q=80",
          order: 1,
          createdAt: new Date().toISOString(),
        },
        {
          id: "q_sample_2",
          quizId: "quiz_sample_1",
          question: "True or False: The family enjoyed warm chamomile tea and biscuits inside the glasshouse pavilion.",
          questionType: "true_false",
          options: ["True", "False"],
          correctAnswer: "True",
          explanation: "Yes! Everyone sat together in the sunlit pavilion enjoying hot tea and fresh biscuits.",
          hint: "Think about the afternoon break in the glasshouse.",
          imageId: "img_sample_2",
          imageUrl:
            "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&auto=format&fit=crop&q=80",
          order: 2,
          createdAt: new Date().toISOString(),
        },
        {
          id: "q_sample_3",
          quizId: "quiz_sample_1",
          question: "What pleasant setting was the backdrop for our afternoon family gathering?",
          questionType: "recall",
          options: ["Botanical rose garden", "Shopping mall", "Airport terminal", "Sports stadium"],
          correctAnswer: "Botanical rose garden",
          explanation: "The botanical rose garden with flowering arbors was the peaceful setting.",
          hint: "Recall the blooming roses and lush paths.",
          imageId: "img_sample_1",
          imageUrl:
            "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&auto=format&fit=crop&q=80",
          order: 3,
          createdAt: new Date().toISOString(),
        },
        {
          id: "q_sample_4",
          quizId: "quiz_sample_1",
          question: "Arrange these reunion moments in chronological order:",
          questionType: "sequence",
          sequenceItems: [
            "Walking through the rose arbor",
            "Enjoying tea in the glasshouse pavilion",
            "Taking the family group photograph",
          ],
          correctAnswer:
            "Walking through the rose arbor -> Enjoying tea in the glasshouse pavilion -> Taking the family group photograph",
          explanation: "Remembering event sequences strengthens chronological memory recall pathways.",
          hint: "The walk through the flowers came first.",
          order: 4,
          createdAt: new Date().toISOString(),
        },
      ],
    };
    saveCustomQuizzes([demoQuiz]);
  }
}

// Helpers for Persistence
export function loadCustomQuizzes(): CustomQuiz[] {
  try {
    seedSampleQuizzesIfEmpty();
    if (!fs.existsSync(QUIZZES_FILE)) return [];
    const raw = fs.readFileSync(QUIZZES_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (e) {
    console.error("Error reading custom_quizzes.json:", e);
    return [];
  }
}

export function saveCustomQuizzes(quizzes: CustomQuiz[]): void {
  try {
    fs.writeFileSync(QUIZZES_FILE, JSON.stringify(quizzes, null, 2), "utf-8");
  } catch (e) {
    console.error("Error saving custom_quizzes.json:", e);
  }
}

export function loadQuizImages(): QuizImage[] {
  try {
    if (!fs.existsSync(IMAGES_FILE)) return [];
    const raw = fs.readFileSync(IMAGES_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (e) {
    console.error("Error reading quiz_images.json:", e);
    return [];
  }
}

export function saveQuizImages(images: QuizImage[]): void {
  try {
    fs.writeFileSync(IMAGES_FILE, JSON.stringify(images, null, 2), "utf-8");
  } catch (e) {
    console.error("Error saving quiz_images.json:", e);
  }
}

export function loadQuizAttempts(): CustomQuizAttempt[] {
  try {
    if (!fs.existsSync(ATTEMPTS_FILE)) return [];
    const raw = fs.readFileSync(ATTEMPTS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (e) {
    console.error("Error reading custom_quiz_attempts.json:", e);
    return [];
  }
}

export function saveQuizAttempts(attempts: CustomQuizAttempt[]): void {
  try {
    fs.writeFileSync(ATTEMPTS_FILE, JSON.stringify(attempts, null, 2), "utf-8");
  } catch (e) {
    console.error("Error saving custom_quiz_attempts.json:", e);
  }
}

// Fallback heuristic generator when Gemini is not connected
function generateHeuristicCustomQuestions(
  title: string,
  difficulty: CustomQuizDifficulty,
  count: number,
  preferredTypes: CustomQuizQuestionType[],
  images: Array<{ id: string; description: string; imageUrl: string; originalFileName?: string }>,
  user: any
): CustomQuizQuestion[] {
  const types: CustomQuizQuestionType[] =
    preferredTypes && preferredTypes.length > 0
      ? preferredTypes
      : ["multiple_choice", "true_false", "short_answer", "recall", "sequence"];

  const questions: CustomQuizQuestion[] = [];
  const validImages = images && images.length > 0 ? images : [];

  for (let i = 0; i < count; i++) {
    const qType = types[i % types.length];
    const img = validImages.length > 0 ? validImages[i % validImages.length] : null;
    const imgDesc = img?.description || "cherished family memory";
    const imgId = img?.id;
    const imgUrl = img?.imageUrl;

    let question = "";
    let correctAnswer = "";
    let options: string[] | undefined = undefined;
    let sequenceItems: string[] | undefined = undefined;
    let explanation = `This question exercises your memory regarding: ${title}.`;
    let hint = "Think about the details of this special moment.";

    // Parse simple sentences from description if available
    const descWords = imgDesc.split(/[.,;!]/).map((s) => s.trim()).filter(Boolean);
    const mainSentence = descWords[0] || `${title} memory`;

    if (qType === "multiple_choice") {
      question = img
        ? `Looking at this photo, what memorable occasion or detail is featured?`
        : `Regarding your memory of "${title}", which detail best describes it?`;
      correctAnswer = mainSentence;
      options = [
        mainSentence,
        "A formal business conference meeting",
        "A quiet visit to the library",
        "A routine doctor appointment checkup",
      ];
      // Randomize options order
      options = options.sort(() => Math.random() - 0.5);
      explanation = `Correct! ${mainSentence} is the special moment captured.`;
      hint = "Look at the setting and peaceful atmosphere.";
    } else if (qType === "true_false") {
      question = img
        ? `True or False: This photograph is associated with "${mainSentence}".`
        : `True or False: "${title}" is one of your cherished personal memories.`;
      options = ["True", "False"];
      correctAnswer = "True";
      explanation = "True! This memory is an important part of your personalized memory collection.";
      hint = "Recall the theme and context you recorded.";
    } else if (qType === "sequence") {
      question = `Arrange these sequential steps related to "${title}" in order:`;
      sequenceItems = [
        "Preparing and arriving at the location",
        "Gathering and enjoying the main activity together",
        "Reflecting on the memorable moments and wrapping up",
      ];
      correctAnswer = sequenceItems.join(" -> ");
      explanation = "Sequencing events helps maintain chronological episodic recall.";
      hint = "Think about what happened first, during, and at the conclusion.";
    } else if (qType === "recall") {
      question = img
        ? `What key detail or family member comes to mind when looking at this photo?`
        : `In your memory of "${title}", what is the most prominent feeling or detail?`;
      correctAnswer = descWords[1] || mainSentence;
      options = [
        correctAnswer,
        "An unfamiliar location",
        "A rushed schedule",
        "A stormy winter blizzard",
      ].sort(() => Math.random() - 0.5);
      explanation = "Excellent recall! Associating photos with feelings strengthens neurological retrieval.";
      hint = "Reflect gently on who was there and what you felt.";
    } else {
      // short_answer
      question = img
        ? `In a few words, what was the special context of this photo?`
        : `What is the central theme of your memory: "${title}"?`;
      correctAnswer = mainSentence;
      explanation = `Well done! ${mainSentence} captures the essence of this memory.`;
      hint = "Provide a brief description matching your recorded context.";
    }

    questions.push({
      id: `q_custom_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
      quizId: "",
      question,
      questionType: qType,
      options,
      correctAnswer,
      sequenceItems,
      explanation,
      hint,
      imageId: imgId,
      imageUrl: imgUrl,
      order: i + 1,
      createdAt: new Date().toISOString(),
    });
  }

  return questions;
}

// Register all Custom Quiz routes
export function registerCustomQuizRoutes(
  app: express.Express,
  getUserFromToken: (token: string | undefined) => any,
  getGeminiClient: () => GoogleGenAI | null
) {
  // Authentication middleware for custom quiz endpoints
  const requireAuth = (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : undefined;
    const user = getUserFromToken(token);
    if (!user) {
      return res.status(401).json({
        error: "Unauthorized. Please log in to manage custom quizzes.",
      });
    }
    (req as any).user = user;
    next();
  };

  // 1. Upload Quiz Image
  app.post(
    "/api/custom-quizzes/upload-image",
    requireAuth,
    async (req: express.Request, res: express.Response) => {
      try {
        const user = (req as any).user;
        const { imageBase64, fileName, mimeType, description } = req.body;

        if (!imageBase64) {
          return res.status(400).json({ error: "Missing image data" });
        }

        // Validate format
        const validMimes = [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/webp",
        ];
        let detectedMime = mimeType || "image/jpeg";
        let rawBase64 = imageBase64;

        if (imageBase64.includes(",")) {
          const match = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            detectedMime = match[1];
            rawBase64 = match[2];
          }
        }

        if (
          !validMimes.includes(detectedMime.toLowerCase()) &&
          !detectedMime.startsWith("image/")
        ) {
          return res.status(400).json({
            error:
              "Unsupported image format. Please upload JPG, PNG, or WEBP photos.",
          });
        }

        // Check size: Max 10MB
        const buffer = Buffer.from(rawBase64, "base64");
        if (buffer.length > 10 * 1024 * 1024) {
          return res.status(400).json({
            error: "Image size exceeds the 10MB limit. Please choose a smaller photo.",
          });
        }

        const ext =
          detectedMime.includes("png")
            ? "png"
            : detectedMime.includes("webp")
            ? "webp"
            : "jpg";
        const imageId = `img_${user.id.slice(0, 8)}_${Date.now()}_${crypto
          .randomBytes(4)
          .toString("hex")}`;
        const storedFileName = `${imageId}.${ext}`;
        const filePath = path.join(UPLOADS_DIR, storedFileName);

        fs.writeFileSync(filePath, buffer);

        const newImage: QuizImage = {
          id: imageId,
          userId: user.id,
          storagePath: filePath,
          imageUrl: `/api/uploads/${storedFileName}`,
          originalFileName: fileName || `photo.${ext}`,
          description: (description || "").trim(),
          uploadedAt: new Date().toISOString(),
          fileSize: buffer.length,
          mimeType: detectedMime,
        };

        const existingImages = loadQuizImages();
        existingImages.push(newImage);
        saveQuizImages(existingImages);

        return res.json({
          success: true,
          image: newImage,
        });
      } catch (err: any) {
        console.error("Error in upload-image:", err);
        return res
          .status(500)
          .json({ error: err.message || "Failed to upload image." });
      }
    }
  );

  // 2. Delete Quiz Image
  app.delete(
    "/api/custom-quizzes/images/:imageId",
    requireAuth,
    (req: express.Request, res: express.Response) => {
      try {
        const user = (req as any).user;
        const { imageId } = req.params;

        const images = loadQuizImages();
        const imgIndex = images.findIndex(
          (img) => img.id === imageId && img.userId === user.id
        );

        if (imgIndex === -1) {
          return res.status(404).json({ error: "Image not found or unauthorized." });
        }

        const [removedImg] = images.splice(imgIndex, 1);
        if (removedImg.storagePath && fs.existsSync(removedImg.storagePath)) {
          try {
            fs.unlinkSync(removedImg.storagePath);
          } catch (e) {
            console.warn("Could not delete file from disk:", e);
          }
        }

        saveQuizImages(images);
        return res.json({ success: true, message: "Image deleted successfully." });
      } catch (err: any) {
        return res.status(500).json({ error: err.message });
      }
    }
  );

  // 3. AI Question Generation
  app.post(
    "/api/custom-quizzes/generate-ai-questions",
    requireAuth,
    async (req: express.Request, res: express.Response) => {
      try {
        const user = (req as any).user;
        const {
          title,
          description,
          difficulty = "medium",
          questionCount = 5,
          preferredTypes = ["multiple_choice", "true_false", "short_answer", "recall", "sequence"],
          images = [],
          sources = {
            uploadedPhotos: true,
            personalMemories: true,
            familyInformation: true,
            audioMemories: true,
          },
        } = req.body;

        const ai = getGeminiClient();
        const requestedCount = Math.min(Math.max(Number(questionCount) || 5, 1), 20);

        if (ai) {
          try {
            const parts: any[] = [];

            // Add images if photo sources permitted
            if (sources.uploadedPhotos && Array.isArray(images) && images.length > 0) {
              for (const img of images) {
                let base64 = img.base64;
                let mimeType = img.mimeType || "image/jpeg";

                // If not provided in body, load from disk
                if (!base64 && img.storagePath && fs.existsSync(img.storagePath)) {
                  try {
                    const buf = fs.readFileSync(img.storagePath);
                    base64 = buf.toString("base64");
                  } catch (e) {
                    console.warn("Could not read image file from disk:", e);
                  }
                }

                if (base64) {
                  if (base64.includes(",")) {
                    const match = base64.match(/^data:([^;]+);base64,(.+)$/);
                    if (match) {
                      mimeType = match[1];
                      base64 = match[2];
                    }
                  }

                  parts.push({
                    inlineData: {
                      mimeType,
                      data: base64,
                    },
                  });

                  parts.push({
                    text: `[Attached Photo ID: "${img.id}", Filename: "${img.originalFileName || "photo"}"] User-provided context/description: "${img.description || "Personal memory photo"}"`,
                  });
                }
              }
            }

            const promptText = `You are MemoryMate AI's specialized cognitive engagement assistant.
Generate ${requestedCount} personalized memory recall questions for ${user.name || "the user"} based on the attached photos and context.

Quiz Parameters:
- Title: "${title || "Custom Memory Quiz"}"
- Description: "${description || "Personal memory and cognitive practice"}"
- Difficulty: "${difficulty}" (easy: direct, obvious cues; medium: moderate recall; hard: subtle detail questions)
- Preferred Question Types: ${preferredTypes.join(", ")}
- Allowed Memory Sources:
  * Uploaded Photos: ${sources.uploadedPhotos ? "YES" : "NO"}
  * Personal Memories: ${sources.personalMemories ? "YES" : "NO"}
  * Family Information: ${sources.familyInformation ? "YES" : "NO"}
  * Audio Memories: ${sources.audioMemories ? "YES" : "NO"}

IMPORTANT SAFETY & PRIVACY RULES:
1. The AI must NOT confidently identify unknown people, sensitive attributes, or personal information that is not explicitly provided in the user's context.
2. Rely strictly on the user-provided context for identifying names, relationships, places, and dates.
3. Observe visible details in the photos (e.g. colors of clothing, location setting like garden/kitchen/living room, background objects, relative positioning like left/right/sitting/standing).
4. If a question is about a specific photo, set "imageId" to that photo's ID!
5. Generate an encouraging, warm "explanation" and a gentle "hint" for every question.
6. For "multiple_choice", provide 2-4 realistic, plausible options with exactly one correct option.
7. For "true_false", provide options: ["True", "False"] and set correctAnswer to "True" or "False".
8. For "sequence", provide 3-4 steps in sequenceItems in correct order.
9. For "short_answer" or "recall", provide a clear question and a concise correctAnswer.

Return strictly valid JSON with this format:
{
  "questions": [
    {
      "question": "Question text",
      "questionType": "multiple_choice" | "true_false" | "short_answer" | "recall" | "sequence",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Exact correct answer",
      "sequenceItems": ["Step 1", "Step 2", "Step 3"],
      "explanation": "Warm, supportive explanation affirming the memory",
      "hint": "Gentle clue to help prompt recall",
      "imageId": "id_of_associated_photo_or_empty"
    }
  ]
}`;

            parts.push({ text: promptText });

            const response = await ai.models.generateContent({
              model: "gemini-3.8-flash",
              contents: parts,
              config: {
                responseMimeType: "application/json",
                temperature: 0.7,
              },
            });

            const text = response.text || "{}";
            const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
            const parsed = JSON.parse(cleaned);

            if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
              const formattedQuestions: CustomQuizQuestion[] = parsed.questions.map(
                (q: any, idx: number) => {
                  const matchingImg = images.find((im: any) => im.id === q.imageId);
                  return {
                    id: `q_custom_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
                    quizId: "",
                    question: q.question || `Memory question ${idx + 1}`,
                    questionType: q.questionType || "multiple_choice",
                    options: q.options || (q.questionType === "true_false" ? ["True", "False"] : undefined),
                    correctAnswer: q.correctAnswer || (q.options ? q.options[0] : "Correct"),
                    sequenceItems: q.sequenceItems,
                    explanation: q.explanation || "Well done exercising your recall!",
                    hint: q.hint || "Take your time and visualize the memory.",
                    imageId: q.imageId || matchingImg?.id || (images[0]?.id || undefined),
                    imageUrl: matchingImg?.imageUrl || (images[0]?.imageUrl || undefined),
                    order: idx + 1,
                    createdAt: new Date().toISOString(),
                  };
                }
              );

              return res.json({
                success: true,
                source: "gemini",
                questions: formattedQuestions,
              });
            }
          } catch (geminiErr) {
            console.warn("Gemini question generation error, falling back to heuristic:", geminiErr);
          }
        }

        // Fallback generator
        const fallbackQuestions = generateHeuristicCustomQuestions(
          title || "Custom Memory Quiz",
          difficulty,
          requestedCount,
          preferredTypes,
          images,
          user
        );

        return res.json({
          success: true,
          source: "local-heuristic",
          questions: fallbackQuestions,
        });
      } catch (err: any) {
        console.error("Error in generate-ai-questions:", err);
        return res
          .status(500)
          .json({ error: err.message || "Failed to generate questions." });
      }
    }
  );

  // 4. Get All Custom Quizzes for Authenticated User
  app.get(
    "/api/custom-quizzes",
    requireAuth,
    (req: express.Request, res: express.Response) => {
      try {
        const user = (req as any).user;
        const allQuizzes = loadCustomQuizzes();
        // Also show sample quizzes or user-created quizzes
        const userQuizzes = allQuizzes.filter(
          (q) => q.userId === user.id || q.id === "quiz_sample_1"
        );

        // Sort by updatedAt descending
        userQuizzes.sort(
          (a, b) =>
            new Date(b.updatedAt || b.createdAt).getTime() -
            new Date(a.updatedAt || a.createdAt).getTime()
        );

        return res.json({ success: true, quizzes: userQuizzes });
      } catch (err: any) {
        return res.status(500).json({ error: err.message });
      }
    }
  );

  // 5. Get Single Custom Quiz by ID
  app.get(
    "/api/custom-quizzes/:id",
    requireAuth,
    (req: express.Request, res: express.Response) => {
      try {
        const user = (req as any).user;
        const { id } = req.params;
        const allQuizzes = loadCustomQuizzes();
        const quiz = allQuizzes.find(
          (q) => q.id === id && (q.userId === user.id || q.id === "quiz_sample_1")
        );

        if (!quiz) {
          return res.status(404).json({ error: "Quiz not found" });
        }

        return res.json({ success: true, quiz });
      } catch (err: any) {
        return res.status(500).json({ error: err.message });
      }
    }
  );

  // 6. Create Custom Quiz
  app.post(
    "/api/custom-quizzes",
    requireAuth,
    (req: express.Request, res: express.Response) => {
      try {
        const user = (req as any).user;
        const {
          title,
          description,
          difficulty = "medium",
          status = "published",
          improveFutureExercises = false,
          questions = [],
          images = [],
        } = req.body;

        if (!title || !title.trim()) {
          return res.status(400).json({ error: "Quiz title is required." });
        }

        const quizId = `quiz_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

        // Map questions with IDs and order
        const formattedQuestions: CustomQuizQuestion[] = questions.map(
          (q: any, index: number) => ({
            id: q.id || `q_${quizId}_${index + 1}`,
            quizId,
            question: q.question || "Untitled Question",
            questionType: q.questionType || "multiple_choice",
            options: q.options,
            correctAnswer: q.correctAnswer || "",
            sequenceItems: q.sequenceItems,
            explanation: q.explanation || "",
            hint: q.hint || "",
            imageId: q.imageId,
            imageUrl: q.imageUrl,
            order: index + 1,
            createdAt: new Date().toISOString(),
          })
        );

        const newQuiz: CustomQuiz = {
          id: quizId,
          userId: user.id,
          title: title.trim(),
          description: (description || "").trim(),
          difficulty,
          questionCount: formattedQuestions.length,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status,
          improveFutureExercises: !!improveFutureExercises,
          questions: formattedQuestions,
          images: Array.isArray(images) ? images : [],
          bestScore: undefined,
          lastAttemptedAt: undefined,
          attemptsCount: 0,
        };

        const allQuizzes = loadCustomQuizzes();
        allQuizzes.push(newQuiz);
        saveCustomQuizzes(allQuizzes);

        return res.status(201).json({ success: true, quiz: newQuiz });
      } catch (err: any) {
        return res.status(500).json({ error: err.message });
      }
    }
  );

  // 7. Update Custom Quiz
  app.put(
    "/api/custom-quizzes/:id",
    requireAuth,
    (req: express.Request, res: express.Response) => {
      try {
        const user = (req as any).user;
        const { id } = req.params;
        const {
          title,
          description,
          difficulty,
          status,
          improveFutureExercises,
          questions,
          images,
        } = req.body;

        const allQuizzes = loadCustomQuizzes();
        const quizIndex = allQuizzes.findIndex(
          (q) => q.id === id && q.userId === user.id
        );

        if (quizIndex === -1) {
          return res.status(404).json({ error: "Quiz not found or unauthorized." });
        }

        const existing = allQuizzes[quizIndex];
        const formattedQuestions: CustomQuizQuestion[] = questions
          ? questions.map((q: any, index: number) => ({
              id: q.id || `q_${id}_${index + 1}`,
              quizId: id,
              question: q.question || "Untitled Question",
              questionType: q.questionType || "multiple_choice",
              options: q.options,
              correctAnswer: q.correctAnswer || "",
              sequenceItems: q.sequenceItems,
              explanation: q.explanation || "",
              hint: q.hint || "",
              imageId: q.imageId,
              imageUrl: q.imageUrl,
              order: index + 1,
              createdAt: q.createdAt || new Date().toISOString(),
            }))
          : existing.questions;

        const updatedQuiz: CustomQuiz = {
          ...existing,
          title: title !== undefined ? title.trim() : existing.title,
          description: description !== undefined ? description.trim() : existing.description,
          difficulty: difficulty !== undefined ? difficulty : existing.difficulty,
          status: status !== undefined ? status : existing.status,
          improveFutureExercises:
            improveFutureExercises !== undefined
              ? !!improveFutureExercises
              : existing.improveFutureExercises,
          questions: formattedQuestions,
          questionCount: formattedQuestions.length,
          images: images !== undefined ? images : existing.images,
          updatedAt: new Date().toISOString(),
        };

        allQuizzes[quizIndex] = updatedQuiz;
        saveCustomQuizzes(allQuizzes);

        return res.json({ success: true, quiz: updatedQuiz });
      } catch (err: any) {
        return res.status(500).json({ error: err.message });
      }
    }
  );

  // 8. Delete Custom Quiz
  app.delete(
    "/api/custom-quizzes/:id",
    requireAuth,
    (req: express.Request, res: express.Response) => {
      try {
        const user = (req as any).user;
        const { id } = req.params;
        const deleteImages =
          req.query.deleteImages === "true" || req.body?.deleteImages === true;

        const allQuizzes = loadCustomQuizzes();
        const quizIndex = allQuizzes.findIndex(
          (q) => q.id === id && q.userId === user.id
        );

        if (quizIndex === -1) {
          return res.status(404).json({ error: "Quiz not found or unauthorized." });
        }

        const [deletedQuiz] = allQuizzes.splice(quizIndex, 1);
        saveCustomQuizzes(allQuizzes);

        // Optionally delete associated images
        if (deleteImages && deletedQuiz.images && deletedQuiz.images.length > 0) {
          const allImages = loadQuizImages();
          for (const img of deletedQuiz.images) {
            const imgIdx = allImages.findIndex((i) => i.id === img.id);
            if (imgIdx !== -1) {
              const [removed] = allImages.splice(imgIdx, 1);
              if (removed.storagePath && fs.existsSync(removed.storagePath)) {
                try {
                  fs.unlinkSync(removed.storagePath);
                } catch (e) {
                  console.warn("Could not delete associated file:", e);
                }
              }
            }
          }
          saveQuizImages(allImages);
        }

        return res.json({
          success: true,
          message: "Quiz deleted successfully.",
        });
      } catch (err: any) {
        return res.status(500).json({ error: err.message });
      }
    }
  );

  // 9. Duplicate Custom Quiz
  app.post(
    "/api/custom-quizzes/:id/duplicate",
    requireAuth,
    (req: express.Request, res: express.Response) => {
      try {
        const user = (req as any).user;
        const { id } = req.params;

        const allQuizzes = loadCustomQuizzes();
        const source = allQuizzes.find(
          (q) => q.id === id && (q.userId === user.id || q.id === "quiz_sample_1")
        );

        if (!source) {
          return res.status(404).json({ error: "Source quiz not found." });
        }

        const newId = `quiz_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
        const duplicatedQuestions: CustomQuizQuestion[] = source.questions.map(
          (q, idx) => ({
            ...q,
            id: `q_${newId}_${idx + 1}`,
            quizId: newId,
            createdAt: new Date().toISOString(),
          })
        );

        const newQuiz: CustomQuiz = {
          ...source,
          id: newId,
          userId: user.id,
          title: `Copy of ${source.title}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          questions: duplicatedQuestions,
          questionCount: duplicatedQuestions.length,
          bestScore: undefined,
          lastAttemptedAt: undefined,
          attemptsCount: 0,
        };

        allQuizzes.push(newQuiz);
        saveCustomQuizzes(allQuizzes);

        return res.status(201).json({ success: true, quiz: newQuiz });
      } catch (err: any) {
        return res.status(500).json({ error: err.message });
      }
    }
  );

  // 10. Add Question to Quiz
  app.post(
    "/api/custom-quizzes/:id/questions",
    requireAuth,
    (req: express.Request, res: express.Response) => {
      try {
        const user = (req as any).user;
        const { id } = req.params;
        const questionData = req.body;

        const allQuizzes = loadCustomQuizzes();
        const quizIndex = allQuizzes.findIndex(
          (q) => q.id === id && q.userId === user.id
        );

        if (quizIndex === -1) {
          return res.status(404).json({ error: "Quiz not found." });
        }

        const quiz = allQuizzes[quizIndex];
        const newQuestion: CustomQuizQuestion = {
          id: questionData.id || `q_${id}_${Date.now()}`,
          quizId: id,
          question: questionData.question || "New Memory Question",
          questionType: questionData.questionType || "multiple_choice",
          options: questionData.options,
          correctAnswer: questionData.correctAnswer || "",
          sequenceItems: questionData.sequenceItems,
          explanation: questionData.explanation || "",
          hint: questionData.hint || "",
          imageId: questionData.imageId,
          imageUrl: questionData.imageUrl,
          order: quiz.questions.length + 1,
          createdAt: new Date().toISOString(),
        };

        quiz.questions.push(newQuestion);
        quiz.questionCount = quiz.questions.length;
        quiz.updatedAt = new Date().toISOString();

        saveCustomQuizzes(allQuizzes);

        return res.status(201).json({ success: true, question: newQuestion });
      } catch (err: any) {
        return res.status(500).json({ error: err.message });
      }
    }
  );

  // 11. Update Question in Quiz
  app.put(
    "/api/custom-quizzes/:id/questions/:questionId",
    requireAuth,
    (req: express.Request, res: express.Response) => {
      try {
        const user = (req as any).user;
        const { id, questionId } = req.params;
        const updateData = req.body;

        const allQuizzes = loadCustomQuizzes();
        const quizIndex = allQuizzes.findIndex(
          (q) => q.id === id && q.userId === user.id
        );

        if (quizIndex === -1) {
          return res.status(404).json({ error: "Quiz not found." });
        }

        const quiz = allQuizzes[quizIndex];
        const qIndex = quiz.questions.findIndex((q) => q.id === questionId);

        if (qIndex === -1) {
          return res.status(404).json({ error: "Question not found." });
        }

        quiz.questions[qIndex] = {
          ...quiz.questions[qIndex],
          ...updateData,
          id: questionId,
          quizId: id,
        };

        quiz.updatedAt = new Date().toISOString();
        saveCustomQuizzes(allQuizzes);

        return res.json({ success: true, question: quiz.questions[qIndex] });
      } catch (err: any) {
        return res.status(500).json({ error: err.message });
      }
    }
  );

  // 12. Delete Question in Quiz
  app.delete(
    "/api/custom-quizzes/:id/questions/:questionId",
    requireAuth,
    (req: express.Request, res: express.Response) => {
      try {
        const user = (req as any).user;
        const { id, questionId } = req.params;

        const allQuizzes = loadCustomQuizzes();
        const quizIndex = allQuizzes.findIndex(
          (q) => q.id === id && q.userId === user.id
        );

        if (quizIndex === -1) {
          return res.status(404).json({ error: "Quiz not found." });
        }

        const quiz = allQuizzes[quizIndex];
        quiz.questions = quiz.questions.filter((q) => q.id !== questionId);
        // Re-number orders
        quiz.questions.forEach((q, idx) => {
          q.order = idx + 1;
        });
        quiz.questionCount = quiz.questions.length;
        quiz.updatedAt = new Date().toISOString();

        saveCustomQuizzes(allQuizzes);

        return res.json({ success: true, message: "Question removed." });
      } catch (err: any) {
        return res.status(500).json({ error: err.message });
      }
    }
  );

  // 13. Submit Quiz Attempt & Evaluate with AI
  app.post(
    "/api/custom-quizzes/:id/submit",
    requireAuth,
    async (req: express.Request, res: express.Response) => {
      try {
        const user = (req as any).user;
        const { id } = req.params;
        const { answers = [], timeTaken = 0 } = req.body;

        const allQuizzes = loadCustomQuizzes();
        const quizIndex = allQuizzes.findIndex(
          (q) => q.id === id && (q.userId === user.id || q.id === "quiz_sample_1")
        );

        if (quizIndex === -1) {
          return res.status(404).json({ error: "Quiz not found." });
        }

        const quiz = allQuizzes[quizIndex];
        const ai = getGeminiClient();

        let correctCount = 0;
        const evaluatedAnswers: any[] = [];
        const missedQuestions: any[] = [];

        for (const ans of answers) {
          const q = quiz.questions.find((item) => item.id === ans.questionId);
          if (!q) continue;

          let isCorrect = false;
          let feedback = q.explanation || "";

          const userAnsStr = (ans.userAnswer || "").trim();
          const correctAnsStr = (q.correctAnswer || "").trim();

          if (q.questionType === "multiple_choice" || q.questionType === "true_false") {
            isCorrect = userAnsStr.toLowerCase() === correctAnsStr.toLowerCase();
          } else if (q.questionType === "sequence") {
            const cleanUser = userAnsStr.toLowerCase().replace(/\s+/g, "");
            const cleanCorrect = correctAnsStr.toLowerCase().replace(/\s+/g, "");
            isCorrect = cleanUser === cleanCorrect;
          } else {
            // short_answer or recall - semantic evaluation via Gemini
            if (ai) {
              try {
                const evalPrompt = `You are evaluating a senior memory app user's recall answer.
Question: "${q.question}"
Expected Fact/Answer: "${correctAnsStr}"
User's Answer: "${userAnsStr}"

Evaluate semantic recall accuracy. If the user captures the intended meaning (e.g. "my brother Rahul" for "Rahul", or "flower arbor" for "rose garden"), treat it as correct!
Return strictly JSON:
{
  "isCorrect": boolean,
  "accuracyPercent": number (0-100),
  "feedback": "Warm, encouraging 1-sentence feedback"
}`;

                const evalRes = await ai.models.generateContent({
                  model: "gemini-3.8-flash",
                  contents: evalPrompt,
                  config: { responseMimeType: "application/json", temperature: 0.2 },
                });

                const parsed = JSON.parse(evalRes.text || "{}");
                isCorrect = !!parsed.isCorrect;
                if (parsed.feedback) feedback = parsed.feedback;
              } catch (e) {
                // Heuristic fallback
                const u = userAnsStr.toLowerCase();
                const c = correctAnsStr.toLowerCase();
                isCorrect = u === c || u.includes(c) || c.includes(u);
              }
            } else {
              const u = userAnsStr.toLowerCase();
              const c = correctAnsStr.toLowerCase();
              isCorrect = u === c || u.includes(c) || c.includes(u);
            }
          }

          if (isCorrect) {
            correctCount++;
          } else {
            missedQuestions.push({
              questionId: q.id,
              topic: q.question,
              correctAnswer: q.correctAnswer,
              category: "Personal Preferences",
            });
          }

          evaluatedAnswers.push({
            questionId: q.id,
            question: q.question,
            questionType: q.questionType,
            userAnswer: userAnsStr,
            correctAnswer: correctAnsStr,
            isCorrect,
            feedback,
            imageUrl: q.imageUrl,
          });
        }

        const total = quiz.questions.length || 1;
        const score = Math.round((correctCount / total) * 100);
        const recallAccuracy = score;

        // Update quiz record
        quiz.attemptsCount = (quiz.attemptsCount || 0) + 1;
        quiz.lastAttemptedAt = new Date().toISOString();
        quiz.bestScore = Math.max(quiz.bestScore || 0, score);
        allQuizzes[quizIndex] = quiz;
        saveCustomQuizzes(allQuizzes);

        // Record attempt
        const attempt: CustomQuizAttempt = {
          id: `att_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`,
          quizId: quiz.id,
          userId: user.id,
          score,
          correctAnswers: correctCount,
          incorrectAnswers: total - correctCount,
          recallAccuracy,
          timeTaken,
          answers: evaluatedAnswers,
          date: new Date().toISOString().split("T")[0],
          completedAt: new Date().toISOString(),
        };

        const attempts = loadQuizAttempts();
        attempts.push(attempt);
        saveQuizAttempts(attempts);

        return res.json({
          success: true,
          attempt,
          quiz,
          missedQuestions,
          improvedMemoryIntegrated: quiz.improveFutureExercises,
        });
      } catch (err: any) {
        console.error("Error in submit custom quiz:", err);
        return res.status(500).json({ error: err.message });
      }
    }
  );
}
