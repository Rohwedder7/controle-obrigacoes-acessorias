# Generated migration for approval workflow

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('core', '0007_submission_batch_id_submission_submission_type_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='submission',
            name='approval_status',
            field=models.CharField(
                choices=[
                    ('pending_review', 'Pendente de Revisão'),
                    ('approved', 'Aprovada'),
                    ('rejected', 'Recusada'),
                    ('needs_revision', 'Necessita Revisão')
                ],
                default='pending_review',
                max_length=20,
                verbose_name='Status de Aprovação'
            ),
        ),
        migrations.AddField(
            model_name='submission',
            name='approval_decision_at',
            field=models.DateTimeField(
                blank=True,
                null=True,
                verbose_name='Data da Decisão'
            ),
        ),
        migrations.AddField(
            model_name='submission',
            name='approval_decision_by',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='approval_decisions',
                to=settings.AUTH_USER_MODEL,
                verbose_name='Decisão por'
            ),
        ),
        migrations.AddField(
            model_name='submission',
            name='approval_comment',
            field=models.TextField(
                blank=True,
                null=True,
                verbose_name='Comentário da Aprovação'
            ),
        ),
    ]

