import mongoose from 'mongoose';

const chatHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    documentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document',
        required: true
    },

    messages: [
        {
            role: {
                type: String,
                enum: ["user", "assistant"],
                required: true,
            },

            content: {
                type: String,
                required: true,
            },

            // Tells whether the answer came from the document
            // or from Gemini's general knowledge
            source: {
                type: String,
                enum: ["document", "general"],
                default: "document",
            },

            timestamp: {
                type: Date,
                default: Date.now,
            },

            relevantChunks: {
                type: [Number],
                default: [],
            },
        },
    ],
},
{
    timestamps: true,
});

chatHistorySchema.index({
    userId: 1,
    documentId: 1,
});

const ChatHistory = mongoose.model("ChatHistory", chatHistorySchema);

export default ChatHistory;