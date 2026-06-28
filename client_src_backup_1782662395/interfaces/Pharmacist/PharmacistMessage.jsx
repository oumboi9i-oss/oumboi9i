import ChatMessage from "../components/Chatmessage";

export default function PharmacistMessage({ onNavigate, currentUser, openUserName, openUserId }) {
  return (
    <ChatMessage
      role="pharmacist"
      onNavigate={onNavigate}
      currentUser={currentUser}
      openUserName={openUserName}
      openUserId={openUserId}
    />
  );
}