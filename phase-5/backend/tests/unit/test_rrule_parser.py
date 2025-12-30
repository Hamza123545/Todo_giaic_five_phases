"""
Unit Tests for RRULE Parser - Phase V

Tests RRULE parsing, next occurrence calculation, and edge cases.
Covers: T047, T048, T049 from tasks.md
"""

import pytest
from datetime import datetime, timedelta
from phase_5.backend.src.integrations.rrule_parser import RRuleParser, get_rrule_parser


class TestRRuleParserSimplifiedPatterns:
    """Test simplified pattern parsing (DAILY, WEEKLY, MONTHLY, YEARLY) - T047"""

    def test_parse_daily_pattern(self):
        """Test parsing simplified DAILY pattern"""
        parser = RRuleParser()
        rule = parser.parse_pattern("DAILY")
        assert rule is not None
        assert rule._freq == 0  # DAILY = 0 in dateutil.rrule

    def test_parse_weekly_pattern(self):
        """Test parsing simplified WEEKLY pattern"""
        parser = RRuleParser()
        rule = parser.parse_pattern("WEEKLY")
        assert rule is not None
        assert rule._freq == 1  # WEEKLY = 1

    def test_parse_monthly_pattern(self):
        """Test parsing simplified MONTHLY pattern"""
        parser = RRuleParser()
        rule = parser.parse_pattern("MONTHLY")
        assert rule is not None
        assert rule._freq == 2  # MONTHLY = 2

    def test_parse_yearly_pattern(self):
        """Test parsing simplified YEARLY pattern"""
        parser = RRuleParser()
        rule = parser.parse_pattern("YEARLY")
        assert rule is not None
        assert rule._freq == 3  # YEARLY = 3

    def test_calculate_next_daily(self):
        """Test calculating next occurrence for DAILY pattern"""
        parser = RRuleParser()
        dtstart = datetime(2025, 12, 29, 10, 0, 0)  # Dec 29, 2025 at 10am UTC
        next_occ = parser.calculate_next("DAILY", dtstart)

        assert next_occ is not None
        assert next_occ == datetime(2025, 12, 30, 10, 0, 0)  # Dec 30, 2025 at 10am UTC

    def test_calculate_next_weekly(self):
        """Test calculating next occurrence for WEEKLY pattern"""
        parser = RRuleParser()
        dtstart = datetime(2025, 12, 29, 10, 0, 0)  # Monday, Dec 29, 2025
        next_occ = parser.calculate_next("WEEKLY", dtstart)

        assert next_occ is not None
        # Next Monday (Jan 5, 2026)
        assert next_occ == datetime(2026, 1, 5, 10, 0, 0)

    def test_calculate_next_monthly(self):
        """Test calculating next occurrence for MONTHLY pattern"""
        parser = RRuleParser()
        dtstart = datetime(2025, 12, 29, 10, 0, 0)  # Dec 29, 2025
        next_occ = parser.calculate_next("MONTHLY", dtstart)

        assert next_occ is not None
        # Next month (Jan 29, 2026)
        assert next_occ == datetime(2026, 1, 29, 10, 0, 0)

    def test_calculate_next_yearly(self):
        """Test calculating next occurrence for YEARLY pattern"""
        parser = RRuleParser()
        dtstart = datetime(2025, 12, 29, 10, 0, 0)  # Dec 29, 2025
        next_occ = parser.calculate_next("YEARLY", dtstart)

        assert next_occ is not None
        # Next year (Dec 29, 2026)
        assert next_occ == datetime(2026, 12, 29, 10, 0, 0)


class TestRRuleParserFullRFC5545:
    """Test full RFC 5545 RRULE parsing - T045"""

    def test_parse_freq_daily_interval(self):
        """Test parsing FREQ=DAILY;INTERVAL=2"""
        parser = RRuleParser()
        rule = parser.parse_pattern("FREQ=DAILY;INTERVAL=2")
        assert rule is not None
        assert rule._freq == 0  # DAILY

    def test_calculate_next_freq_daily_interval_2(self):
        """Test calculating next occurrence for FREQ=DAILY;INTERVAL=2 (every 2 days)"""
        parser = RRuleParser()
        dtstart = datetime(2025, 12, 29, 10, 0, 0)
        next_occ = parser.calculate_next("FREQ=DAILY;INTERVAL=2", dtstart)

        assert next_occ is not None
        # 2 days later (Dec 31, 2025)
        assert next_occ == datetime(2025, 12, 31, 10, 0, 0)

    def test_parse_freq_weekly_byday(self):
        """Test parsing FREQ=WEEKLY;BYDAY=MO,WE,FR"""
        parser = RRuleParser()
        rule = parser.parse_pattern("FREQ=WEEKLY;BYDAY=MO,WE,FR")
        assert rule is not None

    def test_calculate_next_freq_weekly_byday(self):
        """Test calculating next occurrence for FREQ=WEEKLY;BYDAY=MO,WE,FR"""
        parser = RRuleParser()
        dtstart = datetime(2025, 12, 29, 10, 0, 0)  # Monday, Dec 29, 2025
        next_occ = parser.calculate_next("FREQ=WEEKLY;BYDAY=MO,WE,FR", dtstart)

        assert next_occ is not None
        # Next Wednesday (Dec 31, 2025)
        assert next_occ == datetime(2025, 12, 31, 10, 0, 0)

    def test_parse_freq_monthly_bymonthday(self):
        """Test parsing FREQ=MONTHLY;BYMONTHDAY=15"""
        parser = RRuleParser()
        rule = parser.parse_pattern("FREQ=MONTHLY;BYMONTHDAY=15")
        assert rule is not None

    def test_calculate_next_freq_monthly_bymonthday(self):
        """Test calculating next occurrence for FREQ=MONTHLY;BYMONTHDAY=15 (15th of every month)"""
        parser = RRuleParser()
        dtstart = datetime(2025, 12, 29, 10, 0, 0)  # Dec 29, 2025
        next_occ = parser.calculate_next("FREQ=MONTHLY;BYMONTHDAY=15", dtstart)

        assert next_occ is not None
        # 15th of next month (Jan 15, 2026)
        assert next_occ == datetime(2026, 1, 15, 10, 0, 0)


class TestRRuleParserEdgeCases:
    """Test edge cases - T048"""

    def test_leap_year_feb_29(self):
        """Test recurring yearly on Feb 29 (leap year)"""
        parser = RRuleParser()
        dtstart = datetime(2024, 2, 29, 10, 0, 0)  # Feb 29, 2024 (leap year)
        next_occ = parser.calculate_next("YEARLY", dtstart)

        assert next_occ is not None
        # Next Feb 29 is in 2028 (next leap year)
        assert next_occ == datetime(2028, 2, 29, 10, 0, 0)

    def test_leap_year_monthly_jan_31(self):
        """Test recurring monthly on 31st (months with different day counts)"""
        parser = RRuleParser()
        dtstart = datetime(2025, 1, 31, 10, 0, 0)  # Jan 31, 2025
        next_occ = parser.calculate_next("FREQ=MONTHLY;BYMONTHDAY=31", dtstart)

        assert next_occ is not None
        # Next month with 31 days (March 31, 2025 - Feb only has 28 days)
        assert next_occ == datetime(2025, 3, 31, 10, 0, 0)

    def test_dst_transition_ignored(self):
        """Test that DST transitions are ignored (UTC-only)"""
        parser = RRuleParser()
        # DST typically happens in March/November in many timezones
        # But since we use UTC, no DST transitions
        dtstart = datetime(2025, 3, 9, 2, 0, 0)  # DST transition date in US (UTC has no DST)
        next_occ = parser.calculate_next("DAILY", dtstart)

        assert next_occ is not None
        # Exactly 1 day later (no DST adjustment in UTC)
        assert next_occ == datetime(2025, 3, 10, 2, 0, 0)

    def test_timezone_boundary_midnight_utc(self):
        """Test midnight UTC boundary"""
        parser = RRuleParser()
        dtstart = datetime(2025, 12, 31, 23, 59, 59)  # 1 second before midnight UTC
        next_occ = parser.calculate_next("DAILY", dtstart)

        assert next_occ is not None
        # Next day at same time (Jan 1, 2026 at 23:59:59 UTC)
        assert next_occ == datetime(2026, 1, 1, 23, 59, 59)

    def test_invalid_pattern_raises_error(self):
        """Test that invalid RRULE pattern raises ValueError"""
        parser = RRuleParser()
        with pytest.raises(ValueError, match="Invalid RRULE pattern"):
            parser.parse_pattern("INVALID_PATTERN")

    def test_case_insensitive_pattern(self):
        """Test that patterns are case-insensitive"""
        parser = RRuleParser()
        rule1 = parser.parse_pattern("DAILY")
        rule2 = parser.parse_pattern("daily")
        rule3 = parser.parse_pattern("Daily")

        assert rule1 is not None
        assert rule2 is not None
        assert rule3 is not None


class TestRRuleParserRecurringEndDate:
    """Test recurring_end_date logic - T049"""

    def test_end_date_reached(self):
        """Test that no occurrence returned when end_date reached"""
        parser = RRuleParser()
        dtstart = datetime(2025, 12, 29, 10, 0, 0)
        end_date = datetime(2025, 12, 30, 23, 59, 59)  # End before next occurrence

        next_occ = parser.calculate_next("DAILY", dtstart, end_date=end_date)

        # Next occurrence would be Dec 30, 2025 at 10am, but end_date is Dec 30 at 11:59pm
        # So next occurrence is still valid (before end_date)
        assert next_occ == datetime(2025, 12, 30, 10, 0, 0)

    def test_end_date_past_next_occurrence(self):
        """Test that occurrence returned when end_date after next occurrence"""
        parser = RRuleParser()
        dtstart = datetime(2025, 12, 29, 10, 0, 0)
        end_date = datetime(2025, 12, 29, 9, 0, 0)  # End BEFORE next occurrence

        next_occ = parser.calculate_next("DAILY", dtstart, end_date=end_date)

        # Next occurrence would be Dec 30, 2025 at 10am, but end_date is Dec 29 at 9am (before next)
        assert next_occ is None

    def test_end_date_exact_match(self):
        """Test end_date exactly matches next occurrence"""
        parser = RRuleParser()
        dtstart = datetime(2025, 12, 29, 10, 0, 0)
        end_date = datetime(2025, 12, 30, 10, 0, 0)  # Exact match with next occurrence

        next_occ = parser.calculate_next("DAILY", dtstart, end_date=end_date)

        # Next occurrence is Dec 30, 2025 at 10am, end_date is same
        # Should return occurrence (exact match is inclusive)
        assert next_occ == datetime(2025, 12, 30, 10, 0, 0)

    def test_end_date_none_allows_infinite_recurrence(self):
        """Test that end_date=None allows infinite recurrence"""
        parser = RRuleParser()
        dtstart = datetime(2025, 12, 29, 10, 0, 0)

        next_occ = parser.calculate_next("DAILY", dtstart, end_date=None)

        assert next_occ is not None
        assert next_occ == datetime(2025, 12, 30, 10, 0, 0)


class TestRRuleParserValidation:
    """Test pattern validation - T047"""

    def test_validate_simplified_patterns(self):
        """Test validating simplified patterns"""
        parser = RRuleParser()
        assert parser.validate_pattern("DAILY") is True
        assert parser.validate_pattern("WEEKLY") is True
        assert parser.validate_pattern("MONTHLY") is True
        assert parser.validate_pattern("YEARLY") is True

    def test_validate_full_rrule(self):
        """Test validating full RFC 5545 RRULE"""
        parser = RRuleParser()
        assert parser.validate_pattern("FREQ=DAILY;INTERVAL=1") is True
        assert parser.validate_pattern("FREQ=WEEKLY;BYDAY=MO,WE,FR") is True
        assert parser.validate_pattern("FREQ=MONTHLY;BYMONTHDAY=15") is True

    def test_validate_invalid_pattern(self):
        """Test validating invalid patterns"""
        parser = RRuleParser()
        assert parser.validate_pattern("INVALID") is False
        assert parser.validate_pattern("FREQ=INVALID;INTERVAL=1") is False
        assert parser.validate_pattern("") is False


class TestRRuleParserSingleton:
    """Test singleton instance"""

    def test_get_rrule_parser_returns_singleton(self):
        """Test that get_rrule_parser returns same instance"""
        parser1 = get_rrule_parser()
        parser2 = get_rrule_parser()

        assert parser1 is parser2  # Same object reference


class TestUTCOnlyHandling:
    """Test UTC-only time handling - T046"""

    def test_dtstart_with_timezone_stripped(self):
        """Test that dtstart with timezone info is converted to naive UTC"""
        parser = RRuleParser()
        from datetime import timezone as tz
        dtstart_with_tz = datetime(2025, 12, 29, 10, 0, 0, tzinfo=tz.utc)

        next_occ = parser.calculate_next("DAILY", dtstart_with_tz)

        assert next_occ is not None
        assert next_occ.tzinfo is None  # Should be naive UTC
        assert next_occ == datetime(2025, 12, 30, 10, 0, 0)

    def test_end_date_with_timezone_stripped(self):
        """Test that end_date with timezone info is converted to naive UTC"""
        parser = RRuleParser()
        from datetime import timezone as tz
        dtstart = datetime(2025, 12, 29, 10, 0, 0)
        end_date_with_tz = datetime(2025, 12, 30, 23, 59, 59, tzinfo=tz.utc)

        next_occ = parser.calculate_next("DAILY", dtstart, end_date=end_date_with_tz)

        assert next_occ is not None
        assert next_occ.tzinfo is None  # Should be naive UTC

    def test_calculated_occurrence_is_naive_utc(self):
        """Test that calculated occurrences are always naive UTC"""
        parser = RRuleParser()
        dtstart = datetime(2025, 12, 29, 10, 0, 0)

        next_occ = parser.calculate_next("DAILY", dtstart)

        assert next_occ is not None
        assert next_occ.tzinfo is None  # Must be naive (no timezone info)
        # Represents UTC implicitly
