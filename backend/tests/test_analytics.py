"""Tests du service analytics."""
from unittest.mock import MagicMock, patch

from app.services.analytics import estimate_price


def test_estimate_paris():
    price = estimate_price(50, 2, "paris")
    assert price > 0
    assert price > estimate_price(50, 2, "default")


def test_estimate_marseille_higher_than_default():
    marseille = estimate_price(50, 2, "marseille")
    default = estimate_price(50, 2, "montpellier")
    assert marseille > default


def test_estimate_increases_with_area():
    small = estimate_price(30, 2, "lyon")
    large = estimate_price(100, 2, "lyon")
    assert large > small


def test_estimate_increases_with_rooms():
    few = estimate_price(60, 1, "lyon")
    many = estimate_price(60, 5, "lyon")
    assert many > few
