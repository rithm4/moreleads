import toast from 'react-hot-toast';

export const t = {
  saved:   (msg = 'Salvat cu succes!')  => toast.success(msg),
  deleted: (msg = 'Șters cu succes!')  => toast.success(msg, { icon: '🗑️' }),
  error:   (msg = 'Eroare. Încearcă din nou.') => toast.error(msg),
  info:    (msg) => toast(msg),
};
