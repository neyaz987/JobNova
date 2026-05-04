import os
import json
from google import genai
from typing import Optional, Dict, Any, List
from sqlalchemy import func
from PyPDF2 import PdfReader
from docx import Document
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.models import User, CandidateProfile, Skill, Job


client = None
if settings.GEMINI_API_KEY:
    client = genai.Client(api_key=settings.GEMINI_API_KEY)

async def calculate_match_score(job: Job, user: User) -> Dict[str, Any]:
    if not client:
        return {"score": 0, "reasoning": "AI scoring unavailable"}
        
    profile = user.candidate_profile
    if not profile:
        return {"score": 0, "reasoning": "No candidate profile found"}


    job_skills = [s.name for s in job.skills]
    user_skills = [s.name for s in user.skills]
    
    context = {
        "job": {
            "title": job.title,
            "description": job.description,
            "requirements": job.requirements,
            "skills": job_skills,
            "experience_level": job.experience_level.value if hasattr(job.experience_level, 'value') else str(job.experience_level)
        },
        "candidate": {
            "title": profile.current_title,
            "skills": user_skills,
            "experience_years": profile.experience_years,
            "bio": user.bio,
            "education": profile.education,
            "experience": profile.experience
        }
    }
    
    prompt = f"""
    Compare the following Candidate with the Job Requirements.
    Calculate a match score from 0 to 100, provide a brief reasoning, 
    list exactly 3 key strengths, and identify missing technical skills from the job's requirement list.
    
    Context:
    {json.dumps(context)}
    
    Output Format (JSON):
    {{
        "score": number,
        "reasoning": "string",
        "strengths": ["string", "string", "string"],
        "missing_skills": ["string", "string"]
    }}
    
    Only output the JSON.
    """

    try:
        response = client.models.generate_content(
            model='gemini-1.5-flash',
            contents=prompt
        )

        text = response.text.strip()
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
            
        return json.loads(text)
    except Exception as e:
        print(f"AI Matching Error: {e}")
        return {"score": 0, "reasoning": "Error calculating score"}

async def generate_assessment_questions(skill_name: str, count: int = 5) -> List[Dict[str, Any]]:
    if not client:
        return []
        
    prompt = f"""
    Generate {count} multiple-choice questions for the skill: {skill_name}.
    Each question should have 4 options and 1 correct answer.
    
    Output Format (JSON List):
    [
        {{
            "text": "Question text?",
            "options": ["A", "B", "C", "D"],
            "correct_option_index": number (0-3)
        }}
    ]
    
    Only output the JSON.
    """

    try:
        response = client.models.generate_content(
            model='gemini-1.5-flash',
            contents=prompt
        )
        text = response.text.strip()
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
            
        return json.loads(text)
    except Exception as e:
        print(f"AI Assessment Error: {e}")
        return []

async def get_job_recommendations(user: User, available_jobs: List[Job]) -> List[int]:

    if not client or not available_jobs:
        return [j.id for j in available_jobs[:10]]
        
    profile = user.candidate_profile
    if not profile:
        return [j.id for j in available_jobs[:10]]


    candidate_context = {
        "title": profile.current_title,
        "skills": [s.name for s in user.skills],
        "experience_years": profile.experience_years,
        "bio": user.bio
    }
    
    jobs_context = []
    for j in available_jobs[:20]:
        jobs_context.append({
            "id": j.id,
            "title": j.title,
            "skills": [s.name for s in j.skills],
            "description": j.description[:200] + "..."
        })

    prompt = f"""
    Based on the following Candidate Profile, rank the top 10 most relevant Jobs from the provided list.
    Return only a JSON list of Job IDs in order of relevance.
    
    Candidate:
    {json.dumps(candidate_context)}
    
    Jobs List:
    {json.dumps(jobs_context)}
    
    Output Format: [id1, id2, id3, ...]
    Only output the JSON list.
    """

    try:
        response = client.models.generate_content(
            model='gemini-1.5-flash',
            contents=prompt
        )
        text = response.text.strip()
        if "[" in text and "]" in text:
            json_str = text[text.find("["):text.rfind("]")+1]
            return json.loads(json_str)
        return [j.id for j in available_jobs[:10]]
    except Exception as e:
        print(f"AI Recommendation Error: {e}")
        return [j.id for j in available_jobs[:10]]

async def extract_text_from_file(file_path: str) -> str:
    _, ext = os.path.splitext(file_path)
    text = ""
    
    if ext.lower() == '.pdf':
        try:
            reader = PdfReader(file_path)
            for page in reader.pages:
                text += page.extract_text() or ""
        except Exception as e:
            print(f"Error reading PDF: {e}")
            
    elif ext.lower() in ['.doc', '.docx']:
        try:
            doc = Document(file_path)
            for para in doc.paragraphs:
                text += para.text + "\n"
        except Exception as e:
            print(f"Error reading DOCX: {e}")
            
    return text

async def parse_resume_with_ai(file_path: str) -> Optional[Dict[str, Any]]:
    if not client:
        print("GenAI client not initialized")
        return None
        
    text = await extract_text_from_file(file_path)
    if not text.strip():
        return None

    prompt = f"""
    You are an expert HR recruitment AI. Parse the following resume text and extract key information in a strict JSON format.
    
    Resume Text:
    {text[:8000]}
    
    Output Format (JSON):
    {{
        "current_title": "string",
        "current_company": "string",
        "experience_years": number,
        "skills": ["skill1", "skill2"],
        "education": [
            {{ "degree": "string", "institution": "string", "year": "string", "gpa": "string" }}
        ],
        "experience": [
            {{ "title": "string", "company": "string", "start_date": "string", "end_date": "string", "description": "string" }}
        ],
        "summary": "short bio summary"
    }}
    
    Only output the JSON. Do not include markdown code blocks or any other text.
    """

    try:
        response = client.models.generate_content(
            model='gemini-1.5-flash',
            contents=prompt
        )
        text = response.text.strip()
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
            
        return json.loads(text)
    except Exception as e:
        print(f"AI Parsing Error: {e}")
        return None

def calculate_profile_score(user: User, profile: CandidateProfile) -> int:
    score = 0

    weights = {
        "full_name": 5,
        "avatar": 5,
        "phone": 5,
        "location": 5,
        "bio": 10,
        "resume": 20,
        "experience_years": 10,
        "education": 15,
        "experience_list": 15,
        "skills": 10
    }
    
    if user.full_name: score += weights["full_name"]
    if user.avatar_url: score += weights["avatar"]
    if user.phone: score += weights["phone"]
    if user.location: score += weights["location"]
    if user.bio: score += weights["bio"]
    
    if profile.resume_url: score += weights["resume"]
    if profile.experience_years > 0: score += weights["experience_years"]
    if profile.education and len(profile.education) > 0: score += weights["education"]
    if profile.experience and len(profile.experience) > 0: score += weights["experience_list"]
    if user.skills and len(user.skills) > 0: score += weights["skills"]
    
    return min(score, 100)

async def sync_parsed_data_to_profile(db: Session, user: User, parsed_data: Dict[str, Any]):
    profile = user.candidate_profile
    if not profile:
        return
        

    if not profile.current_title:
        profile.current_title = parsed_data.get("current_title")
    if not profile.current_company:
        profile.current_company = parsed_data.get("current_company")
    if profile.experience_years == 0:
        profile.experience_years = parsed_data.get("experience_years", 0)
    if not user.bio:
        user.bio = parsed_data.get("summary")
        

    if not profile.education:
        profile.education = parsed_data.get("education", [])
    if not profile.experience:
        profile.experience = parsed_data.get("experience", [])
        

    if "skills" in parsed_data:
        existing_skill_names = [s.name.lower() for s in user.skills]
        for skill_name in parsed_data["skills"]:
            if skill_name.lower() not in existing_skill_names:
                db_skill = db.query(Skill).filter(func.lower(Skill.name) == skill_name.lower()).first()
                if db_skill:
                    user.skills.append(db_skill)
    
    db.commit()

async def get_resume_improvement_suggestions(user: User) -> List[str]:
    if not client:
        return ["AI analysis currently unavailable."]
        
    profile = user.candidate_profile
    if not profile:
        return ["Please complete your profile or upload a resume first."]

    context = {
        "title": profile.current_title,
        "skills": [s.name for s in user.skills],
        "experience": profile.experience,
        "summary": user.bio
    }
    
    prompt = f"""
    Act as a senior technical recruiter. Analyze the following candidate profile and provide exactly 3 specific, high-impact suggestions to improve their resume for better hireability.
    
    Candidate Profile:
    {json.dumps(context)}
    
    Output Format: JSON list of strings.
    Example: ["Add specific metrics (e.g., '%' or '$') to your experience descriptions", "Include industry keywords like 'Scale' and 'Architecture' to match ATS filters", "Expand on your contributions to the '{profile.current_company or 'current company'}' projects"]
    
    Only output the JSON list of strings. Do not include markdown code blocks.
    """

    try:
        response = client.models.generate_content(
            model='gemini-1.5-flash',
            contents=prompt
        )
        text = response.text.strip()
        if "[" in text and "]" in text:
            json_str = text[text.find("["):text.rfind("]")+1]
            return json.loads(json_str)
        return ["Focus on quantifying your achievements in your latest role.", "Add more technical skills relevant to your target industry.", "Write a more compelling summary highlighting your unique value."]
    except Exception as e:
        print(f"AI Resume Improvement Error: {e}")
        return ["Error getting suggestions."]

async def generate_job_description(title: str, company: str, requirements: Optional[str] = None) -> str:
    if not client:
        return "AI generation unavailable."
        
    prompt = f"""
    Act as a professional Recruiter. Generate a detailed, compelling job description for the following role:
    
    Job Title: {title}
    Company: {company}
    {f'Key Requirements: {requirements}' if requirements else ''}
    
    Include sections for:
    - About the Role
    - Key Responsibilities
    - Requirements & Qualifications
    - Why Join Us
    
    Tone: Professional, engaging, and modern.
    Return only the formatted description text. Do not include markdown code blocks.
    """

    try:
        response = client.models.generate_content(
            model='gemini-1.5-flash',
            contents=prompt
        )
        return response.text.strip()
    except Exception as e:
        print(f"AI JD Generation Error: {e}")
        return "Error generating job description."

async def generate_mock_interview_questions(job_title: str, job_description: str) -> List[str]:
    if not client:
        return ["Tell me about your experience.", "What are your strengths?", "Where do you see yourself in 5 years?"]
        
    prompt = f"""
    Generate 5 challenging technical and behavioral interview questions for the role of '{job_title}'.
    Job Description: {job_description[:1000]}
    
    Output Format: JSON list of strings.
    Only output the JSON list.
    """
    try:
        response = client.models.generate_content(model='gemini-1.5-flash', contents=prompt)
        text = response.text.strip()
        if "[" in text and "]" in text:
            json_str = text[text.find("["):text.rfind("]")+1]
            return json.loads(json_str)
        return ["Error generating questions"]
    except Exception as e:
        print(f"Mock Interview Questions Error: {e}")
        return ["Error generating questions"]

async def get_mock_interview_feedback(job_title: str, questions: List[str], answers: List[str]) -> Dict[str, Any]:
    if not client:
        return {"overall_feedback": "AI analysis unavailable", "score": 0}
        
    interview_data = []
    for q, a in zip(questions, answers):
        interview_data.append({"question": q, "answer": a})
        
    prompt = f"""
    Evaluate the following interview performance for the role of '{job_title}'.
    Provide constructive feedback for each answer, an overall summary, and a performance score (0-100).
    
    Data:
    {json.dumps(interview_data)}
    
    Output Format (JSON):
    {{
        "overall_feedback": "string",
        "score": number,
        "question_feedback": [
            {{ "question": "string", "feedback": "string", "score": number }}
        ]
    }}
    
    Only output the JSON.
    """
    try:
        response = client.models.generate_content(model='gemini-1.5-flash', contents=prompt)
        text = response.text.strip()
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
        return json.loads(text)
    except Exception as e:
        print(f"Mock Interview Feedback Error: {e}")
        return {"overall_feedback": "Error analyzing interview", "score": 0}
