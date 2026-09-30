from django.contrib.auth import authenticate, password_validation
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from .models import User


class UserSerializer(serializers.ModelSerializer):
    """User details returned by the API. Never includes the password."""

    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'date_joined']


class RegisterSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100)
    email = serializers.EmailField(max_length=254)
    # trim_whitespace=False so spaces in a password are kept exactly as typed
    password = serializers.CharField(write_only=True, trim_whitespace=False)
    confirm_password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('An account with this email already exists.')
        return value.lower()

    def validate(self, data):
        errors = {}

        # Django's password rules: minimum length, not too common, not all numbers, not similar to email
        try:
            password_validation.validate_password(
                data['password'], User(name=data['name'], email=data['email'])
            )
        except DjangoValidationError as error:
            errors['password'] = list(error.messages)

        if data['password'] != data['confirm_password']:
            errors['confirm_password'] = ['Passwords do not match.']

        if errors:
            raise serializers.ValidationError(errors)
        return data

    def create(self, validated_data):
        return User.objects.create_user(
            email=validated_data['email'],
            name=validated_data['name'],
            password=validated_data['password'],
        )


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate(self, data):
        user = authenticate(
            request=self.context.get('request'),
            email=data['email'],
            password=data['password'],
        )
        # Same message for unknown email and wrong password, so attackers can't discover accounts
        if user is None:
            raise serializers.ValidationError('Invalid email or password.')
        data['user'] = user
        return data
