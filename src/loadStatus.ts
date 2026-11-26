// Order status of the artist's queue.
// Set the value below to change the active status:
// 0 - Свободно (Все заказы выполняются в обычном порядке.)
// 1 - Слабо загружено (Заказы задержатся на 2 недели.)
// 2 - Загружено (Заказы могут задерживаться на месяц и более.)
// 3 - Закрыты (Заказы не принимаются в ближайшее время.)
export const CURRENT_LOAD_STATUS: 0 | 1 | 2 | 3 = 1;
