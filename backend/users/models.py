from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone


class UserManager(BaseUserManager):
    """Creates users who log in with email instead of a username."""

    def create_user(self, email, name, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required.')
        email = self.normalize_email(email).lower()
        user = self.model(email=email, name=name, **extra_fields)
        user.set_password(password)  # stores a hash, never the plain password
        user.save(using=self._db)
        return user

    def create_superuser(self, email, name, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, name, password, **extra_fields)

    def get_by_natural_key(self, email):
        # Case-insensitive login: "Me@Mail.com" and "me@mail.com" are the same account
        return self.get(email__iexact=email)


class User(AbstractBaseUser, PermissionsMixin):
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']

    def clean(self):
        super().clean()
        self.email = self.email.lower()

    def __str__(self):
        return self.email
