# Classroom Insight AI

<div align="center">
  <h3>Transform classroom videos into actionable teaching insights</h3>
  <p>AI-powered analysis of teaching dynamics, talk time, wait time, and Bloom's Taxonomy distribution</p>
</div>

## 🎯 Overview

Classroom Insight AI is a web-based application that automatically analyzes classroom video recordings to provide educators and administrators with data-driven insights about teaching effectiveness. By leveraging Google's Gemini AI and advanced video processing, the app transforms raw classroom footage into comprehensive analytics that help improve instructional practices.

## ✨ Features

### 📊 **Talk Time Analysis**
- **Teacher vs. Student Talk Ratio**: Automatically calculates the percentage of time teachers speak versus students
- **Silence/Work Time**: Identifies periods of independent work or silence
- **Visual Distribution Charts**: Interactive pie charts showing talk time breakdown

### ⏱️ **Question Wait Time Tracking**
- **Per-Question Analysis**: Measures wait time for each teacher question
- **Best Practice Indicators**: Highlights questions with wait times below recommended thresholds (3+ seconds)
- **Bar Chart Visualization**: Easy-to-read graphs showing wait time patterns

### 🎓 **Bloom's Taxonomy Classification**
- **Automatic Categorization**: Classifies each question by cognitive level (Remember, Understand, Apply, Analyze, Evaluate, Create)
- **Higher-Order Thinking Assessment**: Identifies the balance of lower vs. higher-order questions
- **Interaction Log**: Complete table of all Q&A interactions with Bloom's levels

### 📝 **Full Transcript Generation**
- **Speaker Identification**: Distinguishes between teacher and student speech
- **Timestamped Segments**: Every utterance tagged with precise timestamps
- **Conversation Flow**: Chat-style interface showing the natural flow of classroom dialogue

### 🤖 **AI-Powered Observations**
- **Qualitative Feedback**: Gemini AI provides written summaries of teaching patterns
- **Actionable Insights**: Suggestions for improving classroom dynamics
- **Comprehensive Analysis**: Combines quantitative data with qualitative observations

## 🔧 How It Works

### Technical Architecture

1. **Video Segmentation (FFmpeg.wasm)**
   - Videos are split into 5-minute segments client-side using WebAssembly
   - Enables processing of long videos (20+ minutes) that exceed API limits
   - All processing happens in the browser for privacy and speed

2. **AI Analysis (Google Gemini)**
   - Each video segment is analyzed by Gemini's multimodal AI
   - The AI watches the video and listens to audio simultaneously
   - Extracts:
     - Speaker identification (teacher vs. student)
     - Question detection and transcription
     - Answer transcription
     - Wait time calculations
     - Bloom's Taxonomy classification

3. **Data Aggregation**
   - Results from all segments are combined
   - Overall statistics are calculated (percentages, averages)
   - Final feedback is generated based on complete analysis

4. **Visualization**
   - Interactive charts using Recharts
   - Responsive design with inline CSS styling
   - Real-time progress tracking during analysis

### Technology Stack

- **Frontend**: React 19, TypeScript, Vite
- **AI**: Google Gemini API (multimodal)
- **Video Processing**: FFmpeg.wasm (WebAssembly)
- **Charts**: Recharts
- **Icons**: Lucide React

## 🎓 Why It's Useful for Teachers & Administrators

### For Teachers

#### **Self-Reflection & Professional Development**
- **Data-Driven Self-Assessment**: See exactly how much you talk vs. students
- **Question Quality Analysis**: Understand the cognitive level of your questions
- **Wait Time Awareness**: Identify if you're giving students enough time to think
- **Pattern Recognition**: Spot trends in your teaching style over time

#### **Instructional Improvement**
- **Balance Check**: Ensure students have adequate speaking time
- **Higher-Order Thinking**: Verify you're asking analysis and evaluation questions
- **Engagement Metrics**: Understand classroom participation patterns
- **Evidence-Based Changes**: Make informed adjustments to teaching practices

### For Administrators

#### **Teacher Evaluation & Support**
- **Objective Metrics**: Quantitative data to complement observations
- **Professional Development Planning**: Identify specific areas for teacher growth
- **Consistency Monitoring**: Track teaching practices across classrooms
- **Evidence Collection**: Support evaluation discussions with concrete data

#### **School-Wide Insights**
- **Best Practice Identification**: Recognize teachers with strong questioning techniques
- **Training Needs Assessment**: Identify common areas needing improvement
- **Resource Allocation**: Direct professional development resources effectively
- **Quality Assurance**: Ensure teaching standards are being met

### Key Benefits

✅ **Time-Saving**: Automatic analysis replaces hours of manual video review  
✅ **Objective**: Data-driven insights remove subjective bias  
✅ **Comprehensive**: Captures every interaction, not just highlights  
✅ **Actionable**: Specific metrics lead to concrete improvement strategies  
✅ **Privacy-First**: All processing happens client-side when possible  
✅ **Accessible**: Web-based, no special software required  

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/rottnerin/classroom-insight-ai.git
   cd classroom-insight-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to `http://localhost:3000`

### Building for Production

```bash
npm run build
npm run preview
```

## 🚢 Deployment (Firebase Hosting)

This app is configured for deployment to **Firebase Hosting** on Google Cloud Platform, which integrates seamlessly with Google services and offers a generous free tier.

### Prerequisites

- Firebase CLI installed: `npm install -g firebase-tools`
- Firebase account ([Sign up here](https://firebase.google.com/))
- Google Gemini API key

### Deployment Steps

1. **Login to Firebase**
   ```bash
   firebase login
   ```

2. **Initialize Firebase Hosting** (if not already done)
   ```bash
   firebase init hosting
   ```
   - Select an existing Firebase project or create a new one
   - Set public directory to `dist`
   - Configure as single-page app: **Yes**
   - Don't overwrite `index.html`: **No** (Vite generates it)

3. **Set up production environment variables**
   
   Create a `.env.production` file in the root directory:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```
   
   ⚠️ **Important**: Never commit `.env.production` to version control. It's already in `.gitignore`.

4. **Build the application**
   ```bash
   npm run build
   ```
   This creates the `dist/` directory with optimized production files.

5. **Deploy to Firebase**
   ```bash
   firebase deploy --only hosting
   ```

6. **Access your deployed app**
   
   After deployment, Firebase will provide a URL like:
   ```
   https://your-project-id.web.app
   ```
   
   Share this URL with school administrators to access the application.

### Firebase Configuration

The `firebase.json` file is pre-configured with:
- ✅ **COEP/COOP headers** required for FFmpeg.wasm SharedArrayBuffer support
- ✅ **SPA routing** for React Router compatibility
- ✅ **FFmpeg.wasm file headers** for proper CORS and content types

### Cost

**Firebase Hosting Free Tier (Spark Plan):**
- $0/month
- 10GB storage
- 360MB/day bandwidth (10GB/month)
- Perfect for 1-10 users with moderate usage

**Additional Costs:**
- Google Gemini API: Pay-per-use (varies by usage)
- Custom domain: ~$10-15/year (optional)

### Automatic Deployment (Optional)

To set up automatic deployment on every push to `main`:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project → Hosting → Connect GitHub
3. Follow the setup wizard to connect your repository
4. Configure build settings:
   - Build command: `npm run build`
   - Output directory: `dist`
   - Environment variables: Add `GEMINI_API_KEY`

### Custom Domain (Optional)

1. In Firebase Console → Hosting → Add custom domain
2. Follow DNS configuration instructions
3. SSL certificate is automatically provisioned by Firebase

### Troubleshooting

**FFmpeg.wasm not loading:**
- Ensure `public/ffmpeg/` files are present (they're gitignored but needed for deployment)
- Check browser console for COEP/COOP errors
- Verify Firebase headers are correctly set in `firebase.json`

**API Key issues:**
- Ensure `.env.production` exists with `GEMINI_API_KEY`
- Rebuild after changing environment variables: `npm run build`
- Check that the API key is valid and has sufficient quota

## 📖 Usage Guide

1. **Upload a Video**
   - Click or drag & drop a classroom video file
   - Supported formats: MP4, WebM, MOV (any video format)
   - Recommended: Videos under 200MB for best performance

2. **Wait for Analysis**
   - The app will segment your video automatically
   - Each segment is analyzed by Gemini AI
   - Progress is shown in real-time

3. **Review Insights**
   - **Insights Tab**: View charts, statistics, and AI feedback
   - **Transcript Tab**: Read the full conversation transcript
   - **Interaction Log**: See all Q&A pairs with Bloom's levels

4. **Take Action**
   - Use the data to identify improvement areas
   - Share insights with colleagues or administrators
   - Track progress over time by analyzing multiple videos

## 📊 Understanding the Metrics

### Talk Time Percentages
- **Teacher Talk**: Percentage of time teacher is speaking
- **Student Talk**: Percentage of time students are speaking
- **Silence/Work**: Time for independent work or transitions
- **Ideal Ratio**: Varies by lesson type, but generally aim for 30-40% teacher talk

### Wait Time
- **Recommended**: 3+ seconds after asking a question
- **Too Short**: Students don't have time to process and respond
- **Too Long**: May indicate unclear questions or disengagement

### Bloom's Taxonomy
- **Lower Order** (Remember, Understand): Factual recall
- **Higher Order** (Apply, Analyze, Evaluate, Create): Critical thinking
- **Balance**: Mix of both levels is ideal for comprehensive learning

## 🔒 Privacy & Security

- **Client-Side Processing**: Video segmentation happens in your browser
- **API Security**: Videos are sent to Gemini API for analysis (see Google's privacy policy)
- **No Storage**: Videos are not stored on our servers
- **Local Analysis**: All data processing occurs during your session

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- **Google Gemini**: For powerful multimodal AI capabilities
- **FFmpeg.wasm**: For client-side video processing
- **Recharts**: For beautiful data visualizations

## 📧 Support

For issues, questions, or feature requests, please open an issue on GitHub.

---

<div align="center">
  <p>Built with ❤️ for educators who want to improve their teaching practice</p>
  <p>⭐ Star this repo if you find it useful!</p>
</div>
