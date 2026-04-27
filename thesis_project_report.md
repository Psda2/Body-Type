# Comprehensive Project Report: Body Type & Meal Planner System

## 1. Project Overview

The "Body Type & Meal Planner" is a comprehensive fitness and nutrition platform designed to provide personalized health guidance. The system integrates traditional anthropometric analysis with modern machine learning and generative AI to offer two core functionalities:

1.  **Somatotype Classification**: Predicting a user's body type (Ectomorph, Mesomorph, or Endomorph) from physical measurements.
2.  **AI-Driven Meal Planning**: Generating personalized Sri Lankan meal plans using Retrieval-Augmented Generation (RAG).

## 2. Body Type Prediction System

### 2.1 Model Architecture

The core classification engine uses **Multinomial Logistic Regression**. This model was chosen for its interpretability and efficiency in multi-class classification tasks where the relationship between features and classes can be modeled via linear combinations.

### 2.2 Feature Engineering

The model utilizes 7 key features derived from raw body measurements:

- **Gender**: Binary encoding.
- **BMI**: Calculated as $\text{weight (kg)} / \text{height (m)}^2$.
- **Waist-Hip Ratio**: Indicator of body fat distribution.
- **Shoulder-Waist Ratio**: Measures upper body breadth relative to the core.
- **Chest-Waist Ratio**: Measurement of trunk shape.
- **Height-Waist Ratio**: Anthropometric indicator of body compactness.
- **Frame Index**: Calculated as $\text{Height} / \text{Wrist circumference}$ to determine skeletal robustness.

### 2.3 Ground Truth Labeling & Scoring

To train the model, a labeling methodology based on weighted anthropometric scores was used. The ground truth for each entry in the dataset was determined by the highest value among the following three scores:

| Somatotype    | Formula                                                                                            |
| ------------- | -------------------------------------------------------------------------------------------------- |
| **Endomorph** | $0.5 \times \text{BMI} + 0.3 \times \text{Waist-Hip Ratio} - 0.2 \times \text{Height-Waist Ratio}$ |
| **Mesomorph** | $0.4 \times \text{Shoulder-Waist} + 0.4 \times \text{Chest-Waist} + 0.2 \times \text{Frame Index}$ |
| **Ectomorph** | $0.6 \times \text{Height-Waist} + 0.4 \times \text{Frame Index} - 0.3 \times \text{BMI}$           |

### 2.4 Training & Validation

- **Dataset**: 2,504 labeled entries.
- **Data Split**: 80% Training / 20% Testing (Stratified by Somatotype).
- **Solver**: `lbfgs` with a maximum of 1000 iterations.
- **Accuracy**: **90.42%** on the test set.

## 3. Meal Planning System (RAG)

### 3.1 Retrieval-Augmented Generation (RAG)

The system uses the RAG pattern to combine the generative power of Large Language Models (LLMs) with a curated, domain-specific knowledge base of Sri Lankan nutrition.

- **LLM**: OpenAI `gpt-4o-mini`.
- **Knowledge Base**: A structured JSON repository (`kb.json`) containing traditional Sri Lankan meal options, portion sizes, and body-type-specific guidance.
- **Vector Store**: FAISS (Facebook AI Similarity Search) used for semantic retrieval of relevant nutritional documents.
- **Embeddings**: `sentence-transformers/all-MiniLM-L6-v2`.

### 3.2 Personalized Generation Logic

The RAG pipeline retrieves context based on the user’s specific profile (Gender, BMI Category, and Somatotype). It then prompts the LLM to generate a plan that:

- Rotates through retrieved options to ensure variety.
- Adheres to Sri Lankan culinary traditions.
- Provides specific portion sizes for breakfast, lunch, dinner, and snacks.

## 4. Time-Series & Progress Tracking

The application implements a unique **Temporal Contextual RAG** approach for progress monitoring:

- **Historical Tracking**: Stores a sequence of user measurements over time with ISO-8601 timestamps.
- **Trend Awareness**: The AI chatbot retrieves the last 5 measurements (`weight`, `BMI`, and `ratios`) when responding to user queries.
- **Analysis**: This allows the system to recognize trends (e.g., "Your waist-hip ratio has decreased by 2% over the last month") and provide context-aware fitness advice.

## 5. Technology Stack Summary

| Layer          | Technology                              |
| -------------- | --------------------------------------- |
| **Backend**    | FastAPI (Python)                        |
| **Mobile App** | React Native (Expo)                     |
| **ML/Data**    | Scikit-learn, Pandas, Joblib            |
| **AI/LLM**     | LangChain, OpenAI GPT-4o-mini           |
| **Vector DB**  | FAISS                                   |
| **Database**   | MongoDB (Production) / Local JSON (Dev) |

## 6. Conclusion

The system successfully bridges the gap between classic anthropometric science and modern AI. With over 90% accuracy in body type classification and a robust, data-backed meal planning engine, it provides a high-fidelity tool for personalized health management.
