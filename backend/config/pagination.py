from rest_framework.pagination import PageNumberPagination


class StandardPagination(PageNumberPagination):
    """?page=2 picks the page, ?page_size=20 changes items per page (max 100)."""

    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100
