from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.database.db import Conversation, Message, User, get_session
from app.router.conversation.schema import ConversationDetail, ConversationSummary, MessageResponse

router = APIRouter(prefix="/api/conversations")


async def _get_owned_conversation(
    session: AsyncSession, conversation_id: int, owner_id: int
) -> Conversation:
    conversation = await session.get(Conversation, conversation_id)
    if conversation is None or conversation.owner_id != owner_id:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conversation


@router.get("", response_model=list[ConversationSummary])
async def list_conversations(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    stmt = (
        select(Conversation)
        .where(Conversation.owner_id == current_user.id)
        .order_by(Conversation.updated_at.desc())
    )
    result = await session.execute(stmt)
    return [
        ConversationSummary(
            id=c.id, title=c.title, created_at=c.created_at, updated_at=c.updated_at
        )
        for c in result.scalars().all()
    ]


@router.post("", response_model=ConversationSummary, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    conversation = Conversation(owner_id=current_user.id, title="New conversation")
    session.add(conversation)
    await session.commit()
    await session.refresh(conversation)
    return ConversationSummary(
        id=conversation.id,
        title=conversation.title,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
    )


@router.get("/{conversation_id}", response_model=ConversationDetail)
async def get_conversation(
    conversation_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    conversation = await _get_owned_conversation(session, conversation_id, current_user.id)

    stmt = (
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at)
    )
    result = await session.execute(stmt)
    messages = [
        MessageResponse(
            id=m.id, role=m.role, content=m.content, sources=m.sources, created_at=m.created_at
        )
        for m in result.scalars().all()
    ]

    return ConversationDetail(
        id=conversation.id,
        title=conversation.title,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
        messages=messages,
    )


@router.delete("/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    conversation_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    await _get_owned_conversation(session, conversation_id, current_user.id)
    await session.execute(delete(Conversation).where(Conversation.id == conversation_id))
    await session.commit()
