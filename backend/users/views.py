from django.contrib.auth.models import update_last_login
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import LoginSerializer, RegisterSerializer, UserSerializer


class RegisterView(APIView):
    """POST /api/auth/register/ - create an account and return a login token."""

    # Public endpoint. No authentication, so an old or invalid token sent by the browser can't block it.
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token = Token.objects.create(user=user)
        return Response(
            {'token': token.key, 'user': UserSerializer(user).data},
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    """POST /api/auth/login/ - check email and password and return a login token."""

    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, _ = Token.objects.get_or_create(user=user)
        update_last_login(None, user)
        return Response({'token': token.key, 'user': UserSerializer(user).data})


class LogoutView(APIView):
    """POST /api/auth/logout/ - delete the token so it can no longer be used."""

    def post(self, request):
        request.auth.delete()
        return Response({'detail': 'Logged out successfully.'})


class MeView(APIView):
    """GET /api/auth/me/ - return the user who owns the token."""

    def get(self, request):
        return Response(UserSerializer(request.user).data)
