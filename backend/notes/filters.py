from django.db.models import F, Q
from django.db.models.functions import Lower
from rest_framework.exceptions import ValidationError

from tasks.filters import get_choice_params

from .models import Note

# Allowed values for ?ordering= (put "-" in front for descending, e.g. -created_at)
SORT_FIELDS = {
    'updated_at': F('updated_at'),
    'created_at': F('created_at'),
    'title': Lower('title'),
}
BOOLEAN_VALUES = {'true': True, 'false': False}


def filter_and_sort_notes(notes, params):
    """
    Apply ?search, ?color, ?pinned and ?ordering from the URL.
    color accepts several values separated by commas, e.g. ?color=yellow,blue
    Pinned notes always come first; ?ordering sorts the notes within each group.
    """
    search = params.get('search', '').strip()
    if search:
        notes = notes.filter(Q(title__icontains=search) | Q(content__icontains=search))

    colors = get_choice_params(params, 'color', Note.Color.values)
    if colors:
        notes = notes.filter(color__in=colors)

    pinned = params.get('pinned', '').strip().lower()
    if pinned:
        if pinned not in BOOLEAN_VALUES:
            raise ValidationError({'pinned': ['Use true or false.']})
        notes = notes.filter(pinned=BOOLEAN_VALUES[pinned])

    ordering = params.get('ordering', '-updated_at').strip()
    expression = SORT_FIELDS.get(ordering.lstrip('-'))
    if expression is None:
        raise ValidationError({
            'ordering': [f'Must be one of: {", ".join(SORT_FIELDS)}. Add "-" in front for descending.'],
        })
    order = expression.desc() if ordering.startswith('-') else expression.asc()
    return notes.order_by('-pinned', order, '-id')
