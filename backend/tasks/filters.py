from datetime import date

from django.db.models import Case, F, IntegerField, Q, Value, When
from django.db.models.functions import Lower
from rest_framework.exceptions import ValidationError

from .models import Task

# Allowed values for ?ordering= (put "-" in front for descending, e.g. -due_date)
SORT_FIELDS = {
    'created_at': F('created_at'),
    'due_date': F('due_date'),
    'priority': F('priority_rank'),
    'title': Lower('title'),
}


def filter_and_sort_tasks(tasks, params):
    """
    Apply ?search, ?status, ?priority, ?due_date, ?due_from, ?due_to and ?ordering from the URL.
    status and priority accept several values separated by commas, e.g. ?status=pending,in_progress
    """
    search = params.get('search', '').strip()
    if search:
        tasks = tasks.filter(Q(title__icontains=search) | Q(description__icontains=search))

    statuses = get_choice_params(params, 'status', Task.Status.values)
    if statuses:
        tasks = tasks.filter(status__in=statuses)

    priorities = get_choice_params(params, 'priority', Task.Priority.values)
    if priorities:
        tasks = tasks.filter(priority__in=priorities)

    # ?due_date= one exact day; ?due_from= and ?due_to= a range (used by the calendar)
    for name, lookup in (('due_date', 'due_date'), ('due_from', 'due_date__gte'), ('due_to', 'due_date__lte')):
        day = get_date_param(params, name)
        if day:
            tasks = tasks.filter(**{lookup: day})

    return sort_tasks(tasks, params.get('ordering', '-created_at').strip())


def get_date_param(params, name):
    value = params.get(name, '').strip()
    if not value:
        return None
    try:
        return date.fromisoformat(value)
    except ValueError:
        raise ValidationError({name: ['Use the format YYYY-MM-DD.']})


def get_choice_params(params, name, allowed_values):
    """Read a comma-separated query parameter whose values must come from a fixed set (case-insensitive)."""
    values = [value.strip() for value in params.get(name, '').lower().split(',') if value.strip()]
    if any(value not in allowed_values for value in values):
        raise ValidationError({name: [f'Must be one of: {", ".join(allowed_values)}.']})
    return values


def sort_tasks(tasks, ordering):
    descending = ordering.startswith('-')
    expression = SORT_FIELDS.get(ordering.lstrip('-'))
    if expression is None:
        raise ValidationError({
            'ordering': [f'Must be one of: {", ".join(SORT_FIELDS)}. Add "-" in front for descending.'],
        })

    # Rank priorities so they sort low < medium < high instead of alphabetically
    tasks = tasks.annotate(priority_rank=Case(
        When(priority=Task.Priority.LOW, then=Value(1)),
        When(priority=Task.Priority.MEDIUM, then=Value(2)),
        When(priority=Task.Priority.HIGH, then=Value(3)),
        output_field=IntegerField(),
    ))

    # Tasks without a due date go last; newest first breaks ties so pages stay stable
    if descending:
        order = expression.desc(nulls_last=True)
    else:
        order = expression.asc(nulls_last=True)
    return tasks.order_by(order, '-id')
