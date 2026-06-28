import ChatMessage from "../components/Chatmessage";

export default function FirefighterMessage({ onNavigate, currentUser, openUserName, openUserId }) {
  return (
    <ChatMessage
      role="firefighter"
      onNavigate={onNavigate}
      currentUser={currentUser}
      openUserName={openUserName}
      openUserId={openUserId}
    />
  );
}