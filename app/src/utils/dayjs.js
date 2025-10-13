import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import relativeTime from 'dayjs/plugin/relativeTime';
import updateLocale from 'dayjs/plugin/updateLocale';
import duration from 'dayjs/plugin/duration';
import utc from 'dayjs/plugin/utc';

import i18n from '../locales';

import 'dayjs/locale/zh-cn';

dayjs.locale(i18n.language);
dayjs.extend(utc);
dayjs.extend(duration);
dayjs.extend(updateLocale);
dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);

export default dayjs;
