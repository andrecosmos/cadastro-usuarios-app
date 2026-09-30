import { TZDate } from '@date-fns/tz';

export const BUSINESS_TIME_ZONE = 'America/Sao_Paulo';

function parseDateAndTime(date, time = '00:00') {
    const dateParts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date || '');
    const timeParts = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time || '');

    if (!dateParts || !timeParts) {
        throw new RangeError('Data ou horário inválido.');
    }

    return {
        year: Number(dateParts[1]),
        month: Number(dateParts[2]),
        day: Number(dateParts[3]),
        hour: Number(timeParts[1]),
        minute: Number(timeParts[2])
    };
}

function createBusinessDate(date, time = '00:00') {
    const { year, month, day, hour, minute } = parseDateAndTime(date, time);
    const zonedDate = new TZDate(
        year,
        month - 1,
        day,
        hour,
        minute,
        0,
        0,
        BUSINESS_TIME_ZONE
    );

    if (
        zonedDate.getFullYear() !== year ||
        zonedDate.getMonth() !== month - 1 ||
        zonedDate.getDate() !== day ||
        zonedDate.getHours() !== hour ||
        zonedDate.getMinutes() !== minute
    ) {
        throw new RangeError('Data ou horário inexistente neste fuso.');
    }

    return zonedDate;
}

export function toBusinessDateTimeIso(date, time) {
    return new Date(createBusinessDate(date, time).getTime()).toISOString();
}

export function getBusinessDayBounds(date) {
    const { year, month, day } = parseDateAndTime(date);
    const start = createBusinessDate(date).getTime();
    const nextDay = new TZDate(
        year,
        month - 1,
        day + 1,
        0,
        0,
        0,
        0,
        BUSINESS_TIME_ZONE
    );

    return {
        start: new Date(start),
        endExclusive: new Date(nextDay.getTime())
    };
}

export function formatBusinessTime(value) {
    return new Intl.DateTimeFormat('pt-BR', {
        timeZone: BUSINESS_TIME_ZONE,
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23'
    }).format(new Date(value));
}

export function formatBusinessDate(value) {
    return new Intl.DateTimeFormat('pt-BR', {
        timeZone: BUSINESS_TIME_ZONE,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).format(new Date(value));
}