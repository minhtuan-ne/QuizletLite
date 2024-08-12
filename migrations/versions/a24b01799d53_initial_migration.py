"""Initial migration

Revision ID: a24b01799d53
Revises: 
Create Date: 2024-08-12 17:02:00.001828

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'a24b01799d53'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Create a new table with the desired schema
    op.create_table('new_flashcard',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('front', sa.Text(), nullable=False),
        sa.Column('back', sa.Text(), nullable=False),
        sa.Column('set_id', sa.Integer(), nullable=False),
        sa.Column('front_image', sa.String(length=255), nullable=True),
        sa.Column('back_image', sa.String(length=255), nullable=True),
        sa.ForeignKeyConstraint(['set_id'], ['set.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Copy data from the old table to the new one
    op.execute('INSERT INTO new_flashcard SELECT id, front, back, set_id, front_image, back_image FROM flashcard')
    
    # Drop the old table
    op.drop_table('flashcard')
    
    # Rename the new table to the original name
    op.rename_table('new_flashcard', 'flashcard')

def downgrade():
    # Create the original table
    op.create_table('old_flashcard',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('front', sa.Text(), nullable=False),
        sa.Column('back', sa.Text(), nullable=False),
        sa.Column('set_id', sa.Integer(), nullable=False),
        sa.Column('front_image', sa.String(length=200), nullable=True),
        sa.Column('back_image', sa.String(length=200), nullable=True),
        sa.ForeignKeyConstraint(['set_id'], ['flashcard_set.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Copy data from the current table to the old schema
    op.execute('INSERT INTO old_flashcard SELECT id, front, back, set_id, front_image, back_image FROM flashcard')
    
    # Drop the current table
    op.drop_table('flashcard')
    
    # Rename the old table to the original name
    op.rename_table('old_flashcard', 'flashcard')