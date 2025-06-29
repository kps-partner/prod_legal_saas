"""AI services for generating case insights using OpenAI."""

import os
import asyncio
from typing import Dict, Any
from openai import AsyncOpenAI
import logging

logger = logging.getLogger(__name__)


class AIService:
    """Service for generating AI insights using OpenAI."""
    
    def __init__(self):
        """Initialize the AI service with OpenAI client."""
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable is required")
        
        self.client = AsyncOpenAI(
            api_key=api_key,
            timeout=60.0  # 60 second timeout
        )
    
    async def generate_case_insights(self, notes_text: str) -> Dict[str, Any]:
        """
        Generate AI insights for a case based on notes text.
        
        Args:
            notes_text: Combined text from case notes
            
        Returns:
            Dictionary containing summary, recommendations, and recommendation type
        """
        try:
            # Create the prompt for case analysis
            prompt = self._create_case_analysis_prompt(notes_text)
            
            # Call OpenAI API
            response = await self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an experienced legal assistant helping lawyers analyze potential cases. Provide clear, professional analysis based on the information provided."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=1000,
                temperature=0.3  # Lower temperature for more consistent legal analysis
            )
            
            # Extract the response content
            content = response.choices[0].message.content
            if not content:
                raise ValueError("Empty response from OpenAI")
            
            logger.info(f"Raw OpenAI response: {content}")
            
            # Parse the structured response
            return self._parse_ai_response(content)
            
        except Exception as e:
            logger.error(f"Error generating AI insights: {e}")
            raise Exception(f"Failed to generate AI insights: {str(e)}")
    
    def _create_case_analysis_prompt(self, notes_text: str) -> str:
        """Create a structured prompt for case analysis."""
        return f"""
Please analyze the following case notes and provide a structured legal assessment:

CASE NOTES:
{notes_text}

Please provide your analysis in the following format:

SUMMARY:
[Provide a concise 2-3 sentence summary of the key facts and legal issues]

RECOMMENDATIONS:
[Provide specific recommendations about whether the lawyer should take this case, including key factors to consider]

RECOMMENDATION_TYPE:
[Choose exactly one: "approve" if the case looks strong and worth pursuing, "reject" if the case appears weak or problematic, or "undecided" if more information is needed or the case has mixed prospects]

CONFIDENCE:
[Provide a confidence score from 0.0 to 1.0 indicating how confident you are in your assessment]

Focus on:
- Strength of liability/fault
- Damages and potential recovery
- Complexity and resource requirements
- Likelihood of success
- Any red flags or concerns
"""
    
    def _parse_ai_response(self, content: str) -> Dict[str, Any]:
        """Parse the structured AI response into components."""
        try:
            logger.info(f"Parsing AI response: {content[:200]}...")  # Log first 200 chars for debugging
            
            # Initialize default values
            summary = ""
            recommendations = ""
            recommendation_type = "undecided"
            confidence_score = 0.5
            
            # Use regex to extract sections more reliably
            import re
            
            # Extract SUMMARY section
            summary_match = re.search(r'\*{0,2}SUMMARY:\*{0,2}\s*(.*?)(?=\*{0,2}RECOMMENDATIONS:|$)', content, re.DOTALL | re.IGNORECASE)
            if summary_match:
                summary = summary_match.group(1).strip()
                # Clean up any remaining asterisks
                summary = re.sub(r'^\*+|\*+$', '', summary).strip()
            
            # Extract RECOMMENDATIONS section
            recommendations_match = re.search(r'\*{0,2}RECOMMENDATIONS:\*{0,2}\s*(.*?)(?=\*{0,2}RECOMMENDATION_TYPE:|$)', content, re.DOTALL | re.IGNORECASE)
            if recommendations_match:
                recommendations = recommendations_match.group(1).strip()
                # Clean up any remaining asterisks
                recommendations = re.sub(r'^\*+|\*+$', '', recommendations).strip()
            
            # Extract RECOMMENDATION_TYPE section
            type_match = re.search(r'\*{0,2}RECOMMENDATION_TYPE:\*{0,2}\s*(.*?)(?=\*{0,2}CONFIDENCE:|$)', content, re.DOTALL | re.IGNORECASE)
            if type_match:
                recommendation_type = type_match.group(1).strip()
                # Clean up any remaining asterisks
                recommendation_type = re.sub(r'^\*+|\*+$', '', recommendation_type).strip()
            
            # Extract CONFIDENCE section
            confidence_match = re.search(r'\*{0,2}CONFIDENCE:\*{0,2}\s*(.*?)$', content, re.DOTALL | re.IGNORECASE)
            if confidence_match:
                confidence_str = confidence_match.group(1).strip()
                # Clean up any remaining asterisks
                confidence_str = re.sub(r'^\*+|\*+$', '', confidence_str).strip()
                try:
                    confidence_score = float(confidence_str)
                except (ValueError, TypeError):
                    confidence_score = 0.5
            
            # Clean and validate recommendation_type
            recommendation_type = recommendation_type.lower().strip()
            if recommendation_type not in ["approve", "reject", "undecided"]:
                recommendation_type = "undecided"
            
            # Validate confidence score
            confidence_score = max(0.0, min(1.0, confidence_score))
            
            result = {
                "summary": summary.strip() or "No summary provided.",
                "recommendations": recommendations.strip() or "No recommendations provided.",
                "recommendation_type": recommendation_type,
                "confidence_score": confidence_score
            }
            
            logger.info(f"Parsed AI response: summary={len(result['summary'])} chars, recommendations={len(result['recommendations'])} chars, type={result['recommendation_type']}")
            return result
            
        except Exception as e:
            logger.error(f"Error parsing AI response: {e}")
            logger.error(f"Raw content: {content}")
            # Return safe defaults
            return {
                "summary": "Error parsing AI response.",
                "recommendations": "Please try generating insights again.",
                "recommendation_type": "undecided",
                "confidence_score": 0.5
            }