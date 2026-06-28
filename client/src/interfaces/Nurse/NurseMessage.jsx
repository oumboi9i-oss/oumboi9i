import ChatMessage from "../components/Chatmessage";

export default function NurseMessage({ onNavigate, currentUser, openUserName, openUserId }) {
  return (
    <ChatMessage
      role="nurse"
      onNavigate={onNavigate}
      currentUser={currentUser}
      openUserName={openUserName}
      openUserId={openUserId}
    />
  );
}