import ChatMessage from "../components/Chatmessage";

export default function DoctorMessage({ onNavigate, currentUser, openUserName, openUserId }) {
  return (
    <ChatMessage
      role="doctor"
      onNavigate={onNavigate}
      currentUser={currentUser}
      openUserName={openUserName}
      openUserId={openUserId}
    />
  );
}