const normalizeId = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (value._id) return value._id.toString();
  if (typeof value.toString === 'function') return value.toString();
  return null;
};

const getBoardRole = (board, userId) => {
  const normalizedUserId = normalizeId(userId);
  if (!board || !normalizedUserId) return null;

  if (normalizeId(board.owner) === normalizedUserId) {
    return 'owner';
  }

  const collaborator = (board.collaborators || []).find((entry) => (
    normalizeId(entry.user) === normalizedUserId
  ));

  return collaborator?.role || null;
};

const canEditBoard = (role) => role === 'owner' || role === 'editor';

module.exports = {
  canEditBoard,
  getBoardRole,
  normalizeId
};
