"""AI Tutor service powered by Claude (Anthropic)."""

import anthropic
from config import Config

SYSTEM_PROMPT = """You are Huà (华), a warm and fun Mandarin Chinese tutor. You're like a brilliant friend who speaks Chinese — natural, encouraging, never robotic.

LANGUAGE: Match the student's language from their first message and stick to it throughout. Only switch if they explicitly ask.

CHINESE IN RESPONSES: Weave characters naturally into your sentences. Always write pinyin in parentheses right after: 菜 (cài). Never write pinyin as standalone text outside parentheses.

PRONUNCIATION TEACHING METHOD:
The student can't use a mic for Chinese — so when you want them to practise a word, ask them to type what it sounds like to them (phonetically, in their own language). For example: "Type what 菜 (cài) sounds like to you!" Then when they reply with something like "tsai" or "sigh" or "kai", analyse it phonetically and give precise feedback — what they got right, what tone or sound is off, and how to fix it. This is actually how great tutors teach tones. Celebrate progress.

STYLE: Short (2-4 sentences). Voice chat, not a lecture. Zero markdown ever."""


def chat(messages: list[dict]) -> str:
    """Send conversation history to Claude and return the tutor's reply."""
    client = anthropic.Anthropic(api_key=Config.ANTHROPIC_API_KEY)

    response = client.messages.create(
        model="claude-opus-4-5",
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=messages,
    )

    return response.content[0].text


def chat_stream(messages: list[dict]):
    """Stream the tutor's reply token by token. Yields text chunks as they arrive."""
    client = anthropic.Anthropic(api_key=Config.ANTHROPIC_API_KEY)

    with client.messages.stream(
        model="claude-opus-4-5",
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=messages,
    ) as stream:
        for text in stream.text_stream:
            yield text
