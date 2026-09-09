from django.contrib import admin
from .models import PurchaseSession, PurchaseRecord, FieldAgentProfile

class PurchaseRecordInline(admin.TabularInline):
    model = PurchaseRecord
    extra = 1

@admin.register(PurchaseSession)
class PurchaseSessionAdmin(admin.ModelAdmin):
    list_display = ('waybill_no', 'society_district_name', 'total_kilos', 'total_amount', 'created_at')
    search_fields = ('waybill_no', 'society_district_name', 'zone_name')
    inlines = [PurchaseRecordInline]

@admin.register(PurchaseRecord)
class PurchaseRecordAdmin(admin.ModelAdmin):
    list_display = ('farmer_name', 'kilos', 'amount_ghc', 'date', 'session')
    search_fields = ('farmer_name', 'cocoa_card_id')
    list_filter = ('farmer_status', 'date')

@admin.register(FieldAgentProfile)
class FieldAgentProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'assigned_societies')
    search_fields = ('user__username',)
