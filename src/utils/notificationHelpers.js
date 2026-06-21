export function getNotificationText(event, data) {
  switch (event) {
    case 'conversation:new-reply':
      return `${data.senderName || 'Someone'} replied to your conversation`;
    case 'conversation:completed':
      return `${data.studentName || 'A student'} completed a conversation (Score: ${data.aiScore})`;
    case 'conversation:reviewed':
      return `${data.teacherName} reviewed your conversation on "${data.lessonTitle}" (Score: ${data.teacherScore})`;
    case 'relation:accepted':
      return `${data.teacherName} accepted your connection request!`;
    case 'relation:requested':
      return `${data.studentName} wants you to teach them!`;
    default:
      return 'New notification';
  }
}

export function getNotificationLink(event, data) {
  switch (event) {
    case 'conversation:new-reply':
    case 'conversation:completed':
    case 'conversation:reviewed':
      return `/conversations/${data.conversationId}`;
    case 'relation:accepted':
      return '/my-teachers';
    case 'relation:requested':
      return '/dashboard';
    default:
      return null;
  }
}
